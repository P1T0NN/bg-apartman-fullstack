// LIBRARIES
import { v } from 'convex/values';
import { internalMutation } from '../../../_generated/server.js';

export const saveFeeCheckout = internalMutation({
	args: {
		paymentId: v.id('accommodationFeePayments'),
		sessionId: v.string(),
		url: v.union(v.string(), v.null())
	},
	returns: v.null(),
	handler: async (ctx, { paymentId, sessionId, url }) => {
		const payment = await ctx.db.get('accommodationFeePayments', paymentId);

		if (!payment) throw new Error('Payment not found');

		const hasDifferentCheckoutSession =
			payment.checkoutSessionId && payment.checkoutSessionId !== sessionId;

		if (hasDifferentCheckoutSession) throw new Error('Checkout session mismatch');

		await ctx.db.patch('accommodationFeePayments', paymentId, {
			checkoutSessionId: sessionId,
			checkoutUrl: url ?? undefined,
			status: payment.status === 'creating' ? 'pending' : payment.status,
			updatedAt: Date.now()
		});

		return null;
	}
});
