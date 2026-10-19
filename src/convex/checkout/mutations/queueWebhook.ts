// LIBRARIES
import { v } from 'convex/values';

// CONVEX
import { internal } from '../../_generated/api.js';
import { internalMutation } from '../../_generated/server.js';

// CONFIG
import { CHECKOUT_CONFIG } from '../../../shared/features/checkout/config.js';
import { PAYMENTS_CONFIG } from '../../../shared/features/payments/config.js';

export const queueWebhook = internalMutation({
	args: {
		eventId: v.string(),
		reference: v.optional(v.string()),
		providerPaymentId: v.optional(v.string())
	},
	returns: v.null(),
	handler: async (ctx, { eventId, reference, providerPaymentId }) => {
		const referencedId = reference
			? ctx.db.normalizeId('accommodationFeePayments', reference)
			: null;
		const payment = referencedId
			? await ctx.db.get('accommodationFeePayments', referencedId)
			: providerPaymentId
				? await ctx.db
						.query('accommodationFeePayments')
						.withIndex('by_provider_and_payment_id', (q) =>
							q.eq('provider', 'checkout').eq('providerPaymentId', providerPaymentId)
						)
						.unique()
				: null;
		if (!payment || payment.provider !== 'checkout' || payment.providerEnvironment !== 'sandbox')
			return null;
		const paymentId = payment._id;

		const duplicate = await ctx.db
			.query('checkoutWebhookEvents')
			.withIndex('by_event_id', (q) => q.eq('eventId', eventId))
			.unique();

		if (duplicate) return null;

		await ctx.db.insert('checkoutWebhookEvents', {
			eventId,
			expiresAt: Date.now() + CHECKOUT_CONFIG.webhookEventLifetimeMs
		});
		await ctx.db.patch('accommodationFeePayments', paymentId, {
			nextReconcileAt: Date.now() + PAYMENTS_CONFIG.reconcileIntervalMs
		});

		await ctx.scheduler.runAfter(
			0,
			internal.checkout.actions.reconcileFeeCheckout.reconcileFeeCheckout,
			{ paymentId }
		);

		return null;
	}
});
