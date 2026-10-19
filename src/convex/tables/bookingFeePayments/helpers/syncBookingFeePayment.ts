// AGGREGATES
import { bookingFeePendingAggregate } from '../aggregates/bookingFeeAggregates.js';

// TYPES
import type { Doc } from '../../../_generated/dataModel.js';
import type { MutationCtx } from '../../../_generated/server.js';

/** Expected online payment allocations are never debts owed by the host. */
export async function syncBookingFeePayment(ctx: MutationCtx, booking: Doc<'bookings'>) {
	const existing = await ctx.db
		.query('bookingFeePayments')
		.withIndex('by_booking_id', (q) => q.eq('bookingId', booking._id))
		.unique();
	if (existing?.paidAt !== undefined) return;
	const terms = booking.platformFeeTerms;
	const { hostId } = booking;
	const expectsOnlineSplit =
		booking.paymentMethod === 'online' &&
		(booking.status === 'confirmed' || booking.status === 'completed') &&
		hostId !== undefined &&
		terms?.model === 'booking_fee' &&
		terms.amountMinor > 0;
	if (!expectsOnlineSplit) {
		if (existing?.pendingOnlineSplit) {
			await ctx.db.patch('bookingFeePayments', existing._id, { pendingOnlineSplit: false });
			await bookingFeePendingAggregate.replaceOrInsert(ctx, existing, {
				...existing,
				pendingOnlineSplit: false
			});
		}
		return;
	}
	if (existing?.pendingOnlineSplit) return;
	const invalidTerms =
		!Number.isSafeInteger(terms.amountMinor) ||
		!Number.isSafeInteger(terms.baseAmountMinor) ||
		terms.amountMinor > terms.baseAmountMinor ||
		terms.baseAmountMinor !== booking.cancellationTerms.stayPricing.totalMinor ||
		terms.currency !== booking.cancellationTerms.currency;
	if (invalidTerms) throw new Error('Invalid frozen booking fee');
	if (existing) {
		const update = {
			pendingOnlineSplit: true,
			grossAmountMinor: terms.baseAmountMinor,
			hostAmountMinor: terms.baseAmountMinor - terms.amountMinor
		};
		await ctx.db.patch('bookingFeePayments', existing._id, update);
		await bookingFeePendingAggregate.replaceOrInsert(ctx, existing, { ...existing, ...update });
		return;
	}
	const id = await ctx.db.insert('bookingFeePayments', {
		bookingId: booking._id,
		accommodationId: booking.accommodationId,
		hostId,
		amountMinor: terms.amountMinor,
		grossAmountMinor: terms.baseAmountMinor,
		hostAmountMinor: terms.baseAmountMinor - terms.amountMinor,
		pendingOnlineSplit: true,
		currency: terms.currency,
		accruedAt: booking._creationTime,
		refundedAmountMinor: 0
	});
	const fee = await ctx.db.get('bookingFeePayments', id);
	if (fee) await bookingFeePendingAggregate.insert(ctx, fee);
}
