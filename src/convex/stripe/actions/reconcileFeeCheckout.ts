'use node';

// LIBRARIES
import { v } from 'convex/values';

// CONVEX
import { internalAction } from '../../_generated/server.js';
import { internal } from '../../_generated/api.js';

// HELPERS
import { retrieveCheckoutSession } from '../helpers/retrieveCheckoutSession.js';
import { expireCheckoutSession } from '../helpers/expireCheckoutSession.js';
import { applyFeeCheckoutSession } from '../helpers/applyFeeCheckoutSession.js';
import { findFeeCheckoutSession } from '../helpers/findFeeCheckoutSession.js';

export const reconcileFeeCheckout = internalAction({
	args: { paymentId: v.id('accommodationFeePayments'), expire: v.boolean() },
	returns: v.null(),
	handler: async (ctx, { paymentId, expire }) => {
		const payment = await ctx.runQuery(
			internal.tables.accommodationFeePayments.queries.getFeePayment.getFeePayment,
			{ paymentId }
		);

		if (!payment) return null;
		let session = payment.checkoutSessionId
			? await retrieveCheckoutSession(payment.checkoutSessionId)
			: await findFeeCheckoutSession(payment);
		if (!session) {
			await ctx.runMutation(
				internal.tables.accommodationFeePayments.mutations.expireUnattachedCheckout
					.expireUnattachedCheckout,
				{ paymentId }
			);
			return null;
		}
		await ctx.runMutation(
			internal.tables.accommodationFeePayments.mutations.saveFeeCheckout.saveFeeCheckout,
			{ paymentId: payment._id, sessionId: session.id, url: session.url }
		);

		const shouldExpireCheckout = expire && session.status === 'open';
		if (shouldExpireCheckout) {
			try {
				session = await expireCheckoutSession(session.id);
			} catch {
				session = await retrieveCheckoutSession(session.id);
			}
		}

		await applyFeeCheckoutSession(ctx, session);

		return null;
	}
});
