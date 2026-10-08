'use node';

// LIBRARIES
import { ConvexError, v, type Infer } from 'convex/values';

// CONVEX
import { internal } from '../../../_generated/api.js';

// BUILDERS
import { authenticatedAction } from '../../../builders/convexFunctionBuilders.js';

// CONFIG
import { STRIPE_CONFIG } from '../../../../shared/features/stripe/config.js';

// HELPERS
import { createFeeCheckoutSession } from '../../../stripe/helpers/createFeeCheckoutSession.js';
import { retrieveCheckoutSession } from '../../../stripe/helpers/retrieveCheckoutSession.js';
import { applyFeeCheckoutSession } from '../../../stripe/helpers/applyFeeCheckoutSession.js';
import { expireCheckoutSession } from '../../../stripe/helpers/expireCheckoutSession.js';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';

const checkoutResult = v.object({
	url: v.union(v.string(), v.null()),
	paymentId: v.id('accommodationFeePayments')
});

export const createFeeCheckout = authenticatedAction({
	rateLimit: { name: 'accommodations:pay-flat-fee', config: STRIPE_CONFIG.checkoutRequestLimit },
	args: { accommodationId: v.id('accommodations') },
	returns: checkoutResult,
	handler: async (ctx, args): Promise<Infer<typeof checkoutResult>> => {
		let payment = await ctx.runMutation(
			internal.tables.accommodationFeePayments.mutations.beginFeeCheckout.beginFeeCheckout,
			args
		);
		const mustReconcilePreviousCheckout =
			payment.checkoutSessionId && (payment.invalidated || payment.expiresAt <= Date.now());
		if (mustReconcilePreviousCheckout) {
			await ctx.runAction(internal.stripe.actions.reconcileFeeCheckout.reconcileFeeCheckout, {
				paymentId: payment._id,
				expire: true
			});
			const previous = await ctx.runQuery(
				internal.tables.accommodationFeePayments.queries.getFeePayment.getFeePayment,
				{ paymentId: payment._id }
			);
			const mustWaitForPreviousPayment = !previous || previous.paidAt || !previous.closedAt;
			if (mustWaitForPreviousPayment) return { url: null, paymentId: payment._id };
			payment = await ctx.runMutation(
				internal.tables.accommodationFeePayments.mutations.beginFeeCheckout.beginFeeCheckout,
				args
			);
		}

		const session = payment.checkoutSessionId
			? await retrieveCheckoutSession(payment.checkoutSessionId)
			: await createFeeCheckoutSession(payment);

		await ctx.runMutation(
			internal.tables.accommodationFeePayments.mutations.saveFeeCheckout.saveFeeCheckout,
			{ paymentId: payment._id, sessionId: session.id, url: session.url }
		);

		const saved = await ctx.runQuery(
			internal.tables.accommodationFeePayments.queries.getFeePayment.getFeePayment,
			{ paymentId: payment._id }
		);

		const shouldExpireInvalidatedCheckout = saved?.invalidated && session.status === 'open';

		if (shouldExpireInvalidatedCheckout) {
			await expireCheckoutSession(session.id);
			throw new ConvexError<BackendErrorData>({ code: 'ACCOMMODATION_BILLING_PLAN_CHANGED' });
		}

		await applyFeeCheckoutSession(ctx, session);

		if (session.status === 'expired')
			throw new ConvexError<BackendErrorData>({ code: 'FEE_CHECKOUT_EXPIRED' });

		return { url: session.status === 'open' ? session.url : null, paymentId: payment._id };
	}
});
