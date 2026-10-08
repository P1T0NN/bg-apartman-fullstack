// LIBRARIES
import { v } from 'convex/values';
import { internalMutation } from '../../../_generated/server.js';
import { internal } from '../../../_generated/api.js';

// HELPERS
import { getLatestFeePayment } from '../helpers/getLatestFeePayment.js';

// CONFIG
import { STRIPE_CONFIG } from '../../../../shared/features/stripe/config.js';

// UTILS
import { calculatePaidPeriodEnd } from '../../../../shared/features/payments/utils/calculatePaidPeriodEnd.js';

export const applyFeeCheckout = internalMutation({
	args: {
		paymentReference: v.string(),
		sessionId: v.string(),
		clientReference: v.union(v.string(), v.null()),
		amountMinor: v.union(v.number(), v.null()),
		currency: v.union(v.string(), v.null()),
		paymentIntentId: v.union(v.string(), v.null()),
		mode: v.string(),
		status: v.union(v.literal('open'), v.literal('complete'), v.literal('expired'), v.null()),
		paymentStatus: v.string(),
		failed: v.boolean(),
		eventId: v.optional(v.string()),
		eventType: v.optional(v.string()),
		refundedAmountMinor: v.number()
	},
	returns: v.object({
		paymentId: v.union(v.id('accommodationFeePayments'), v.null()),
		refund: v.boolean()
	}),
	handler: async (ctx, args) => {
		const paymentId = ctx.db.normalizeId('accommodationFeePayments', args.paymentReference);

		const payment = paymentId ? await ctx.db.get('accommodationFeePayments', paymentId) : null;

		if (!payment) return { paymentId: null, refund: false };

		const matchesReceipt =
			args.clientReference === payment._id &&
			args.mode === 'payment' &&
			args.amountMinor === payment.terms.amountMinor &&
			args.currency?.toUpperCase() === payment.terms.currency &&
			(!payment.checkoutSessionId || payment.checkoutSessionId === args.sessionId);

		if (!matchesReceipt) throw new Error('Stripe checkout does not match the recorded fee');

		const now = Date.now();

		if (args.eventId) {
			const seen = await ctx.db
				.query('stripeWebhookEvents')
				.withIndex('by_event_id', (q) => q.eq('eventId', args.eventId!))
				.unique();

			if (seen) return { paymentId: payment._id, refund: payment.status === 'refund_pending' };

			await ctx.db.insert('stripeWebhookEvents', {
				eventId: args.eventId,
				type: args.eventType ?? 'checkout',
				processedAt: now
			});
		}

		const isSettledPayment =
			payment.status === 'refunded' ||
			payment.status === 'paid' ||
			payment.status === 'refund_pending';

		if (isSettledPayment)
			return { paymentId: payment._id, refund: payment.status === 'refund_pending' };

		if (args.paymentStatus === 'paid') {
			if (!args.paymentIntentId) throw new Error('Paid checkout has no payment intent');

			const hasInvalidRefundedAmount =
				!Number.isSafeInteger(args.refundedAmountMinor) ||
				args.refundedAmountMinor < 0 ||
				args.refundedAmountMinor > payment.terms.amountMinor;

			if (hasInvalidRefundedAmount) throw new Error('Invalid refunded amount');

			const fullyRefunded = args.refundedAmountMinor === payment.terms.amountMinor;
			const accommodation = await ctx.db.get('accommodations', payment.accommodationId);
			const latest = await getLatestFeePayment(ctx, payment.accommodationId);
			const terms = accommodation?.billingTerms;

			const canActivate =
				!fullyRefunded &&
				!payment.invalidated &&
				latest?._id === payment._id &&
				accommodation &&
				accommodation.ownerId === payment.ownerId &&
				accommodation.status !== 'deleted' &&
				accommodation.billingPlanId === 'flat_fee' &&
				terms?.model === 'flat_fee' &&
				terms.amountMinor === payment.terms.amountMinor &&
				terms.currency === payment.terms.currency &&
				terms.intervalMonths === payment.terms.intervalMonths &&
				!(
					accommodation.billingStatus === 'active' &&
					accommodation.billingPeriodEndsAt !== null &&
					accommodation.billingPeriodEndsAt > now
				);

			const billingPeriodEndsAt = canActivate
				? calculatePaidPeriodEnd(now, payment.terms.intervalMonths)
				: undefined;

			const shouldRefundPayment = !canActivate && !fullyRefunded;

			await ctx.db.patch('accommodationFeePayments', payment._id, {
				checkoutSessionId: args.sessionId,
				paymentIntentId: args.paymentIntentId,
				paidAt: now,
				status: fullyRefunded ? 'refunded' : canActivate ? 'paid' : 'refund_pending',
				entitlementApplied: Boolean(canActivate),
				refundedAmountMinor: args.refundedAmountMinor,
				billingPeriodEndsAt,
				updatedAt: now,
				cleanupAt: undefined,
				closedAt: undefined,
				nextReconcileAt: shouldRefundPayment
					? now + STRIPE_CONFIG.reconciliationRetryMs
					: undefined,
				refundAmountMinor: shouldRefundPayment
					? payment.terms.amountMinor - args.refundedAmountMinor
					: payment.refundAmountMinor,
				refundAttempt: shouldRefundPayment ? 1 : payment.refundAttempt
			});

			const shouldGrantPaidPeriod = canActivate && billingPeriodEndsAt !== undefined;

			if (shouldGrantPaidPeriod) {
				await ctx.db.patch('accommodations', payment.accommodationId, {
					billingStatus: 'active',
					billingPeriodEndsAt,
					updatedAt: now
				});

				await ctx.scheduler.runAt(
					billingPeriodEndsAt,
					internal.tables.accommodations.mutations.expireFlatFeeAccommodation
						.expireFlatFeeAccommodation,
					{ id: payment.accommodationId, billingPeriodEndsAt }
				);
			}

			return { paymentId: payment._id, refund: shouldRefundPayment };
		}

		const isUnpaidAttemptClosed = payment.status === 'failed' || payment.status === 'expired';
		const hasFailedCompletedPayment = payment.status === 'failed' && args.status === 'complete';
		const isProviderClosedUnpaid =
			args.status === 'expired' || args.failed || hasFailedCompletedPayment;
		const shouldPreserveClosedAttempt = isUnpaidAttemptClosed && !isProviderClosedUnpaid;
		if (shouldPreserveClosedAttempt) return { paymentId: payment._id, refund: false };

		const status = args.failed
			? 'failed'
			: args.status === 'expired'
				? 'expired'
				: args.status === 'complete'
					? 'processing'
					: 'pending';

		// An invalidated attempt can never become payable again from an older event.
		await ctx.db.patch('accommodationFeePayments', payment._id, {
			checkoutSessionId: args.sessionId,
			status: payment.invalidated ? 'expired' : isUnpaidAttemptClosed ? payment.status : status,
			updatedAt: now,
			closedAt: isProviderClosedUnpaid ? (payment.closedAt ?? now) : payment.closedAt,
			cleanupAt: isProviderClosedUnpaid
				? (payment.cleanupAt ?? now + STRIPE_CONFIG.unpaidAttemptRetentionMs)
				: undefined,
			nextReconcileAt: isProviderClosedUnpaid
				? undefined
				: now + STRIPE_CONFIG.reconciliationRetryMs
		});

		return { paymentId: payment._id, refund: false };
	}
});
