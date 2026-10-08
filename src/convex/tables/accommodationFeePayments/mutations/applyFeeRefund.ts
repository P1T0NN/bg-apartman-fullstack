// LIBRARIES
import { v } from 'convex/values';
import { internalMutation } from '../../../_generated/server.js';

// SCHEMAS
import { accommodationFeePayments } from '../schema.js';

export const applyFeeRefund = internalMutation({
	args: {
		paymentIntentId: v.string(),
		amountMinor: v.number(),
		currency: v.string(),
		refundedAmountMinor: v.number(),
		refundId: v.optional(v.string()),
		refundStatus: accommodationFeePayments.validator.fields.refundStatus,
		eventId: v.optional(v.string()),
		eventType: v.optional(v.string())
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const payment = await ctx.db
			.query('accommodationFeePayments')
			.withIndex('by_payment_intent_id', (q) => q.eq('paymentIntentId', args.paymentIntentId))
			.unique();

		if (!payment) return null;

		const validAmounts =
			args.amountMinor === payment.terms.amountMinor &&
			args.currency.toUpperCase() === payment.terms.currency &&
			Number.isSafeInteger(args.refundedAmountMinor) &&
			args.refundedAmountMinor >= 0 &&
			args.refundedAmountMinor <= args.amountMinor;

		if (!validAmounts) throw new Error('Stripe refund does not match the recorded fee');

		const now = Date.now();

		if (args.eventId) {
			const seen = await ctx.db
				.query('stripeWebhookEvents')
				.withIndex('by_event_id', (q) => q.eq('eventId', args.eventId!))
				.unique();

			if (seen) return null;

			await ctx.db.insert('stripeWebhookEvents', {
				eventId: args.eventId,
				type: args.eventType ?? 'refund',
				processedAt: now
			});
		}

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
