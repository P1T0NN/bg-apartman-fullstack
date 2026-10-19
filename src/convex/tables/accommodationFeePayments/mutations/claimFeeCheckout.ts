// LIBRARIES
import { v } from 'convex/values';

// CONVEX
import { internalMutation } from '../../../_generated/server.js';

// CONFIG
import { PAYMENTS_CONFIG } from '../../../../shared/features/payments/config.js';

export const claimFeeCheckout = internalMutation({
	args: { paymentId: v.id('accommodationFeePayments') },
	returns: v.boolean(),
	handler: async (ctx, { paymentId }) => {
		const payment = await ctx.db.get('accommodationFeePayments', paymentId);
		if (
			!payment ||
			payment.invalidated ||
			payment.status !== 'creating' ||
			payment.expiresAt <= Date.now() ||
			payment.checkoutRequestStartedAt !== undefined
		)
			return false;
		// Hosted-page creation has no documented idempotency support; issue it once per attempt.
		await ctx.db.patch('accommodationFeePayments', paymentId, {
			checkoutRequestStartedAt: Date.now(),
			nextReconcileAt: Date.now() + PAYMENTS_CONFIG.reconcileIntervalMs
		});
		return true;
	}
});
