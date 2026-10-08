// LIBRARIES
import { v } from 'convex/values';

// CONVEX
import { internalMutation } from '../../../_generated/server.js';
import { internal } from '../../../_generated/api.js';

// CONFIG
import { STRIPE_CONFIG } from '../../../../shared/features/stripe/config.js';

export const maintainFeePaymentsCron = internalMutation({
	args: {},
	returns: v.null(),
	handler: async (ctx) => {
		const now = Date.now();
		const due = await ctx.db
			.query('accommodationFeePayments')
			.withIndex('by_next_reconcile_at', (q) =>
				q.gt('nextReconcileAt', 0).lte('nextReconcileAt', now)
			)
			.take(STRIPE_CONFIG.maintenanceBatchSize);
		for (const payment of due) {
			await ctx.db.patch('accommodationFeePayments', payment._id, {
				nextReconcileAt: now + STRIPE_CONFIG.reconciliationRetryMs
			});
			await ctx.scheduler.runAfter(
				0,
				internal.stripe.actions.reconcileFeeCheckout.reconcileFeeCheckout,
				{
					paymentId: payment._id,
					expire: payment.invalidated || payment.expiresAt <= now
				}
			);
		}
		const expired = await ctx.db
			.query('accommodationFeePayments')
			.withIndex('by_cleanup_at', (q) => q.gt('cleanupAt', 0).lte('cleanupAt', now))
			.take(STRIPE_CONFIG.maintenanceBatchSize);
		for (const payment of expired) {
			const isClosedUnpaid =
				payment.closedAt &&
				!payment.paidAt &&
				payment.refundedAmountMinor === 0 &&
				(payment.status === 'expired' || payment.status === 'failed');
			if (isClosedUnpaid) await ctx.db.delete('accommodationFeePayments', payment._id);
			else await ctx.db.patch('accommodationFeePayments', payment._id, { cleanupAt: undefined });
		}
		const hasMoreMaintenance =
			due.length === STRIPE_CONFIG.maintenanceBatchSize ||
			expired.length === STRIPE_CONFIG.maintenanceBatchSize;
		if (hasMoreMaintenance)
			await ctx.scheduler.runAfter(
				0,
				internal.tables.accommodationFeePayments.crons.maintainFeePaymentsCron
					.maintainFeePaymentsCron,
				{}
			);
		return null;
	}
});
