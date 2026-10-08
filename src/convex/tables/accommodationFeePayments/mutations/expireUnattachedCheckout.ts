// LIBRARIES
import { v } from 'convex/values';
import { internalMutation } from '../../../_generated/server.js';

// CONFIG
import { STRIPE_CONFIG } from '../../../../shared/features/stripe/config.js';

export const expireUnattachedCheckout = internalMutation({
	args: { paymentId: v.id('accommodationFeePayments') },
	returns: v.null(),
	handler: async (ctx, { paymentId }) => {
		const payment = await ctx.db.get('accommodationFeePayments', paymentId);

		const shouldExpireUnattachedAttempt =
			payment && !payment.checkoutSessionId && !payment.paidAt && payment.expiresAt <= Date.now();

		if (shouldExpireUnattachedAttempt)
			await ctx.db.patch('accommodationFeePayments', paymentId, {
				status: 'expired',
				invalidated: true,
				closedAt: Date.now(),
				cleanupAt: Date.now() + STRIPE_CONFIG.unpaidAttemptRetentionMs,
				nextReconcileAt: undefined,
				updatedAt: Date.now()
			});

		return null;
	}
});
