// LIBRARIES
import { v } from 'convex/values';

// CONVEX
import { internal } from '../../_generated/api.js';
import { internalMutation } from '../../_generated/server.js';

// CONFIG
import { CHECKOUT_CONFIG } from '../../../shared/features/checkout/config.js';
import { PAYMENTS_CONFIG } from '../../../shared/features/payments/config.js';

export const maintainFeePayments = internalMutation({
	args: {},
	returns: v.null(),
	handler: async (ctx) => {
		const now = Date.now();
		const due = await ctx.db
			.query('accommodationFeePayments')
			.withIndex('by_provider_and_next_reconcile_at', (q) =>
				q.eq('provider', 'checkout').gt('nextReconcileAt', 0).lte('nextReconcileAt', now)
			)
			.take(CHECKOUT_CONFIG.reconciliationBatchSize);
		for (const payment of due) {
			await ctx.db.patch('accommodationFeePayments', payment._id, {
				nextReconcileAt: now + PAYMENTS_CONFIG.reconcileIntervalMs
			});
			await ctx.scheduler.runAfter(
				0,
				internal.checkout.actions.reconcileFeeCheckout.reconcileFeeCheckout,
				{ paymentId: payment._id }
			);
		}
		const expiredEvents = await ctx.db
			.query('checkoutWebhookEvents')
			.withIndex('by_expires_at', (q) => q.lte('expiresAt', now))
			.take(CHECKOUT_CONFIG.webhookCleanupBatchSize);
		for (const event of expiredEvents) await ctx.db.delete('checkoutWebhookEvents', event._id);
		return null;
	}
});
