// LIBRARIES
import { ConvexError, v } from 'convex/values';
import { internalMutation } from '../../../_generated/server.js';

// HELPERS
import { requireAdminIdentity, getOwnerId } from '../../../betterAuth/helpers/requireIdentity.js';

// CONFIG
import { STRIPE_CONFIG } from '../../../../shared/features/stripe/config.js';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';

export const requestFeeRefund = internalMutation({
	args: { paymentId: v.id('accommodationFeePayments'), expectedAmountMinor: v.number() },
	returns: v.null(),
	handler: async (ctx, { paymentId, expectedAmountMinor }) => {
		const identity = await requireAdminIdentity(ctx);

		const payment = await ctx.db.get('accommodationFeePayments', paymentId);

		const remaining = payment ? payment.terms.amountMinor - payment.refundedAmountMinor : 0;

		const canRefundReviewedAmount =
			payment?.paidAt &&
			payment.paymentIntentId &&
			remaining > 0 &&
			remaining === expectedAmountMinor;

		if (!canRefundReviewedAmount)
			throw new ConvexError<BackendErrorData>({ code: 'FEE_REFUND_UNAVAILABLE' });

		const hasPendingRefund =
			payment.status === 'refund_pending' &&
			payment.refundStatus !== 'failed' &&
			payment.refundStatus !== 'canceled';

		if (hasPendingRefund) return null;

		await ctx.db.patch('accommodationFeePayments', paymentId, {
			status: 'refund_pending',
			refundAmountMinor: remaining,
			refundAttempt: (payment.refundAttempt ?? 0) + 1,
			refundRequestedBy: getOwnerId(identity),
			refundId: undefined,
			refundStatus: undefined,
			nextReconcileAt: Date.now() + STRIPE_CONFIG.reconciliationRetryMs,
			updatedAt: Date.now()
		});

		return null;
	}
});
