// LIBRARIES
import { v } from 'convex/values';
import { internalMutation } from '../../../_generated/server.js';

// SCHEMAS
import { accommodationFeePayments } from '../schema.js';

// HELPERS
import { syncFlatFeeRevenueAggregate } from '../helpers/syncFlatFeeRevenueAggregate.js';

export const applyFeeRefund = internalMutation({
	args: {
		provider: v.string(),
		providerPaymentId: v.string(),
		amountMinor: v.number(),
		currency: v.string(),
		refundedAmountMinor: v.number(),
		refundId: v.optional(v.string()),
		refundStatus: accommodationFeePayments.validator.fields.refundStatus
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const payment = await ctx.db
			.query('accommodationFeePayments')
			.withIndex('by_provider_and_payment_id', (q) =>
				q.eq('provider', args.provider).eq('providerPaymentId', args.providerPaymentId)
			)
			.unique();

		if (!payment) return null;

		const validAmounts =
			args.amountMinor === payment.terms.amountMinor &&
			args.currency.toUpperCase() === payment.terms.currency &&
			Number.isSafeInteger(args.refundedAmountMinor) &&
			args.refundedAmountMinor >= 0 &&
			args.refundedAmountMinor <= args.amountMinor;

		if (!validAmounts) throw new Error('Payment refund does not match the recorded fee');

		const now = Date.now();

		const refundedAmountMinor = Math.max(payment.refundedAmountMinor, args.refundedAmountMinor);

		const fullyRefunded = refundedAmountMinor === payment.terms.amountMinor;

		await ctx.db.patch('accommodationFeePayments', payment._id, {
			refundedAmountMinor,
			refundId: args.refundId ?? payment.refundId,
			refundStatus: args.refundStatus ?? payment.refundStatus,
			status: fullyRefunded ? 'refunded' : payment.status,
			entitlementApplied: fullyRefunded ? false : payment.entitlementApplied,
			nextReconcileAt: fullyRefunded ? undefined : payment.nextReconcileAt,
			updatedAt: now
		});

		const refundedPayment = await ctx.db.get('accommodationFeePayments', payment._id);
		if (refundedPayment) await syncFlatFeeRevenueAggregate(ctx, refundedPayment);
		const shouldRevokePaidPeriod = fullyRefunded && payment.entitlementApplied;

		if (shouldRevokePaidPeriod) {
			const accommodation = await ctx.db.get('accommodations', payment.accommodationId);

			const samePeriod =
				accommodation?.billingPlanId === 'flat_fee' &&
				accommodation.billingPeriodEndsAt === payment.billingPeriodEndsAt;

			if (samePeriod)
				await ctx.db.patch('accommodations', payment.accommodationId, {
					billingStatus: 'pending_payment',
					billingPeriodEndsAt: null,
					updatedAt: now
				});
		}

		return null;
	}
});
