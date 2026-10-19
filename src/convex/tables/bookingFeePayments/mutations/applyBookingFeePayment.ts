// LIBRARIES
import { v } from 'convex/values';

// CONVEX
import { internalMutation } from '../../../_generated/server.js';

// AGGREGATES
import {
	bookingFeePendingAggregate,
	bookingFeePaidAggregate,
	bookingFeeRevenueAggregate
} from '../aggregates/bookingFeeAggregates.js';

/** The trusted adapter verifies capture and both allocations before recording the platform share. */
export const applyBookingFeePayment = internalMutation({
	args: {
		bookingId: v.id('bookings'),
		provider: v.string(),
		providerPaymentId: v.string(),
		amountMinor: v.number(),
		grossAmountMinor: v.number(),
		hostAmountMinor: v.number(),
		paidAt: v.number(),
		currency: v.string(),
		refundedAmountMinor: v.number()
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const booking = await ctx.db.get('bookings', args.bookingId);
		if (!booking) throw new Error('Booking not found');
		const terms = booking.platformFeeTerms;
		const { hostId } = booking;
		const canVerifySplit =
			booking.paymentMethod === 'online' && hostId !== undefined && terms?.model === 'booking_fee';
		if (!canVerifySplit) throw new Error('Booking has no online commission split');
		const isInvalidPayment =
			!args.provider.trim() ||
			!args.providerPaymentId.trim() ||
			!Number.isSafeInteger(args.amountMinor) ||
			args.amountMinor < 0 ||
			args.amountMinor !== terms.amountMinor ||
			!Number.isSafeInteger(args.grossAmountMinor) ||
			args.grossAmountMinor <= 0 ||
			args.grossAmountMinor !== terms.baseAmountMinor ||
			args.grossAmountMinor !== booking.cancellationTerms.stayPricing.totalMinor ||
			!Number.isSafeInteger(args.hostAmountMinor) ||
			args.hostAmountMinor < 0 ||
			args.hostAmountMinor !== args.grossAmountMinor - args.amountMinor ||
			args.currency !== terms.currency ||
			args.currency !== booking.cancellationTerms.currency ||
			!Number.isSafeInteger(args.paidAt) ||
			args.paidAt < 0 ||
			args.paidAt > Date.now() ||
			!Number.isSafeInteger(args.refundedAmountMinor) ||
			args.refundedAmountMinor < 0 ||
			args.refundedAmountMinor > args.amountMinor;
		if (isInvalidPayment) throw new Error('Invalid booking fee payment');
		const fee = await ctx.db
			.query('bookingFeePayments')
			.withIndex('by_booking_id', (q) => q.eq('bookingId', booking._id))
			.unique();
		const mismatchedFee =
			fee &&
			(fee.amountMinor !== terms.amountMinor ||
				fee.currency !== terms.currency ||
				fee.hostId !== hostId);
		if (mismatchedFee) throw new Error('Booking fee does not match frozen terms');
		const isDifferentPayment =
			fee?.paidAt !== undefined &&
			(fee.provider !== args.provider ||
				fee.providerPaymentId !== args.providerPaymentId ||
				fee.paidAt !== args.paidAt);
		if (isDifferentPayment) throw new Error('Booking fee already paid');
		const reused = await ctx.db
			.query('bookingFeePayments')
			.withIndex('by_provider_and_provider_payment_id', (q) =>
				q.eq('provider', args.provider).eq('providerPaymentId', args.providerPaymentId)
			)
			.unique();
		if (reused && reused.bookingId !== booking._id) throw new Error('Payment already assigned');
		const update = {
			paidAt: args.paidAt,
			provider: args.provider,
			providerPaymentId: args.providerPaymentId,
			grossAmountMinor: args.grossAmountMinor,
			hostAmountMinor: args.hostAmountMinor,
			pendingOnlineSplit: false,
			refundedAmountMinor: Math.max(fee?.refundedAmountMinor ?? 0, args.refundedAmountMinor)
		};
		if (fee) {
			await ctx.db.patch('bookingFeePayments', fee._id, update);
			const next = { ...fee, ...update };
			await bookingFeePendingAggregate.replaceOrInsert(ctx, fee, next);
			await bookingFeePaidAggregate.replaceOrInsert(ctx, fee, next);
			await bookingFeeRevenueAggregate.replaceOrInsert(ctx, fee, next);
		} else {
			const id = await ctx.db.insert('bookingFeePayments', {
				bookingId: booking._id,
				accommodationId: booking.accommodationId,
				hostId,
				amountMinor: terms.amountMinor,
				currency: terms.currency,
				accruedAt: booking._creationTime,
				...update
			});
			const captured = await ctx.db.get('bookingFeePayments', id);
			if (captured) {
				await bookingFeePaidAggregate.insert(ctx, captured);
				await bookingFeeRevenueAggregate.insert(ctx, captured);
			}
		}
		return null;
	}
});
