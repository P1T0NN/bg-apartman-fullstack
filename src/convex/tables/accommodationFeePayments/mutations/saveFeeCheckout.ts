// LIBRARIES
import { v } from 'convex/values';
import { internalMutation } from '../../../_generated/server.js';

// CONFIG
import { PAYMENTS_CONFIG } from '../../../../shared/features/payments/config.js';

export const saveFeeCheckout = internalMutation({
	args: {
		paymentId: v.id('accommodationFeePayments'),
		provider: v.string(),
		providerCheckoutId: v.string(),
		url: v.union(v.string(), v.null())
	},
	returns: v.null(),
	handler: async (ctx, { paymentId, provider, providerCheckoutId, url }) => {
		const payment = await ctx.db.get('accommodationFeePayments', paymentId);

		if (!payment || payment.provider !== provider) throw new Error('Payment provider mismatch');
		if (!providerCheckoutId.trim()) throw new Error('Checkout reference is required');

		const hasDifferentCheckoutSession =
			payment.providerCheckoutId && payment.providerCheckoutId !== providerCheckoutId;

		if (hasDifferentCheckoutSession) throw new Error('Checkout session mismatch');

		await ctx.db.patch('accommodationFeePayments', paymentId, {
			providerCheckoutId,
			checkoutUrl: url ?? undefined,
			nextReconcileAt: Date.now() + PAYMENTS_CONFIG.reconcileIntervalMs,
			status: payment.status === 'creating' ? 'pending' : payment.status,
			updatedAt: Date.now()
		});

		return null;
	}
});
