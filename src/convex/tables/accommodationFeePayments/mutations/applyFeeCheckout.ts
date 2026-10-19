// LIBRARIES
import { v } from 'convex/values';
import { internalMutation } from '../../../_generated/server.js';
import { internal } from '../../../_generated/api.js';

// CONFIG
import { PAYMENTS_CONFIG } from '../../../../shared/features/payments/config.js';

// HELPERS
import { getLatestFeePayment } from '../helpers/getLatestFeePayment.js';
import { syncFlatFeeRevenueAggregate } from '../helpers/syncFlatFeeRevenueAggregate.js';

// UTILS
import { calculatePaidPeriodEnd } from '../../../../shared/features/payments/utils/calculatePaidPeriodEnd.js';

export const applyFeeCheckout = internalMutation({
	args: {
		paymentId: v.id('accommodationFeePayments'),
		provider: v.string(),
		providerCheckoutId: v.string(),
		amountMinor: v.number(),
		currency: v.string(),
		providerPaymentId: v.optional(v.string()),
		status: v.union(
			v.literal('pending'),
			v.literal('processing'),
			v.literal('paid'),
			v.literal('expired'),
			v.literal('failed')
		),
		refundedAmountMinor: v.number()
	},
	returns: v.object({
		paymentId: v.union(v.id('accommodationFeePayments'), v.null()),
		refund: v.boolean()
	}),
	handler: async (ctx, args) => {
		const payment = await ctx.db.get('accommodationFeePayments', args.paymentId);

		if (!payment) return { paymentId: null, refund: false };

		const matchesReceipt =
			args.provider === payment.provider &&
			Boolean(args.providerCheckoutId.trim()) &&
			args.amountMinor === payment.terms.amountMinor &&
			args.currency.toUpperCase() === payment.terms.currency &&
			(!payment.providerCheckoutId || payment.providerCheckoutId === args.providerCheckoutId);

		if (!matchesReceipt) throw new Error('Payment checkout does not match the recorded fee');

		const now = Date.now();

		const isSettledPayment =
			payment.status === 'refunded' ||
			payment.status === 'paid' ||
			payment.status === 'refund_pending';

		if (isSettledPayment)
			return { paymentId: payment._id, refund: payment.status === 'refund_pending' };

		if (args.status === 'paid') {
			if (!args.providerPaymentId?.trim())
				throw new Error('Paid checkout has no payment reference');

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
				providerCheckoutId: args.providerCheckoutId,
				providerPaymentId: args.providerPaymentId,
				paidAt: now,
				status: fullyRefunded ? 'refunded' : canActivate ? 'paid' : 'refund_pending',
				entitlementApplied: Boolean(canActivate),
				refundedAmountMinor: args.refundedAmountMinor,
				billingPeriodEndsAt,
				updatedAt: now,
				cleanupAt: undefined,
				closedAt: undefined,
				nextReconcileAt: shouldRefundPayment
					? (payment.nextReconcileAt ?? now + PAYMENTS_CONFIG.reconcileIntervalMs)
					: undefined,
				refundAmountMinor: shouldRefundPayment
					? payment.terms.amountMinor - args.refundedAmountMinor
					: payment.refundAmountMinor,
				refundAttempt: shouldRefundPayment ? 1 : payment.refundAttempt
			});

			const collectedPayment = await ctx.db.get('accommodationFeePayments', payment._id);
			if (collectedPayment) await syncFlatFeeRevenueAggregate(ctx, collectedPayment);
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
		const isProviderClosedUnpaid = args.status === 'expired' || args.status === 'failed';
		const shouldPreserveClosedAttempt = isUnpaidAttemptClosed && !isProviderClosedUnpaid;
		if (shouldPreserveClosedAttempt) return { paymentId: payment._id, refund: false };

		// An invalidated attempt can never become payable again from an older event.
		await ctx.db.patch('accommodationFeePayments', payment._id, {
			providerCheckoutId: args.providerCheckoutId,
			providerPaymentId: args.providerPaymentId ?? payment.providerPaymentId,
			status: payment.invalidated
				? 'expired'
				: isUnpaidAttemptClosed
					? payment.status
					: args.status,
			updatedAt: now,
			closedAt: isProviderClosedUnpaid ? (payment.closedAt ?? now) : payment.closedAt,
			cleanupAt: undefined,
			nextReconcileAt: isProviderClosedUnpaid ? undefined : payment.nextReconcileAt
		});

		return { paymentId: payment._id, refund: false };
	}
});
