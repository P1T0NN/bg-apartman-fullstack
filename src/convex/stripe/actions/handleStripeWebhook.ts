'use node';

// LIBRARIES
import Stripe from 'stripe';
import { v } from 'convex/values';

// CONVEX
import { internalAction } from '../../_generated/server.js';
import { internal } from '../../_generated/api.js';

// CONFIG
import { STRIPE_CONFIG } from '../../../shared/features/stripe/config.js';

// SCHEMAS
import { stripeRefundStatusSchema } from '../../../shared/features/stripe/schemas/stripeSchemas.js';

// HELPERS
import { verifyStripeWebhook } from '../helpers/verifyStripeWebhook.js';
import { retrieveCheckoutSession } from '../helpers/retrieveCheckoutSession.js';
import { applyFeeCheckoutSession } from '../helpers/applyFeeCheckoutSession.js';
import { retrievePaymentRefundState } from '../helpers/retrievePaymentRefundState.js';
import { retrievePaymentRefund } from '../helpers/retrievePaymentRefund.js';

// UTILS
import { getStripeObjectId } from '../utils/getStripeObjectId.js';

// TYPES
import type { StripeEvent } from '../../../shared/features/stripe/types/stripeTypes.js';

export const handleStripeWebhook = internalAction({
	args: { payload: v.string(), signature: v.string() },
	returns: v.boolean(),
	handler: async (ctx, { payload, signature }) => {
		let event: StripeEvent;

		try {
			event = await verifyStripeWebhook(payload, signature);
		} catch (error) {
			const isInvalidWebhook =
				error instanceof Stripe.errors.StripeSignatureVerificationError ||
				error instanceof SyntaxError;
			if (isInvalidWebhook) return false;
			throw error;
		}

		const liveKey = STRIPE_CONFIG.liveKeyPattern.test(process.env.STRIPE_SECRET_KEY ?? '');

		if (event.livemode !== liveKey) return false;
		if (event.account) return true;

		switch (event.type) {
			case 'checkout.session.completed':
			case 'checkout.session.async_payment_succeeded':
			case 'checkout.session.async_payment_failed':
			case 'checkout.session.expired': {
				const session = await retrieveCheckoutSession(event.data.object.id);
				await applyFeeCheckoutSession(ctx, session, event);
				break;
			}
			case 'refund.created':
			case 'refund.updated':
			case 'refund.failed': {
				const refund = await retrievePaymentRefund(event.data.object.id);

				const intentId = getStripeObjectId(refund.payment_intent);

				if (!intentId) break;

				const payment = await ctx.runQuery(
					internal.tables.accommodationFeePayments.queries.getFeePaymentByIntent
						.getFeePaymentByIntent,
					{ paymentIntentId: intentId }
				);

				if (!payment) break;

				const state = await retrievePaymentRefundState(intentId);

				await ctx.runMutation(
					internal.tables.accommodationFeePayments.mutations.applyFeeRefund.applyFeeRefund,
					{
						...state,
						refundId: refund.id,
						refundStatus: stripeRefundStatusSchema.parse(refund.status),
						eventId: event.id,
						eventType: event.type
					}
				);

				break;
			}
			case 'charge.refunded': {
				const charge = event.data.object;

				const intentId = getStripeObjectId(charge.payment_intent);

				if (!intentId) break;

				const payment = await ctx.runQuery(
					internal.tables.accommodationFeePayments.queries.getFeePaymentByIntent
						.getFeePaymentByIntent,
					{ paymentIntentId: intentId }
				);

				if (!payment) break;

				const state = await retrievePaymentRefundState(intentId);

				await ctx.runMutation(
					internal.tables.accommodationFeePayments.mutations.applyFeeRefund.applyFeeRefund,
					{ ...state, eventId: event.id, eventType: event.type }
				);

				break;
			}
		}
		return true;
	}
});
