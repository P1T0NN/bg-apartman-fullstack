// LIBRARIES
import { v } from 'convex/values';

// CONVEX
import { internalMutation } from '../../../_generated/server.js';

// CONFIG
import { PAYMENTS_CONFIG } from '../../../../shared/features/payments/config.js';

export const saveFeeReconciliation = internalMutation({
	args: {
		paymentId: v.id('accommodationFeePayments'),
		retry: v.boolean(),
		creationRejected: v.optional(v.boolean())
	},
	returns: v.null(),
	handler: async (ctx, { paymentId, retry, creationRejected }) => {
		const payment = await ctx.db.get('accommodationFeePayments', paymentId);
		if (!payment) return null;
		const abandonedCreation = !payment.providerCheckoutId && payment.expiresAt <= Date.now();
		const rejectedCreation =
			creationRejected && !payment.providerCheckoutId && payment.status === 'creating';
		await ctx.db.patch('accommodationFeePayments', paymentId, {
			nextReconcileAt:
				retry && !abandonedCreation && !rejectedCreation
					? Date.now() + PAYMENTS_CONFIG.reconcileIntervalMs
					: undefined,
			status: rejectedCreation ? 'failed' : abandonedCreation ? 'expired' : payment.status,
			invalidated: Boolean(rejectedCreation) || abandonedCreation || payment.invalidated,
			closedAt: rejectedCreation ? Date.now() : payment.closedAt,
			updatedAt: Date.now()
		});
		return null;
	}
});
