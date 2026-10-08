// CONVEX
import { internal } from '../../_generated/api.js';

// CONFIG
import { STRIPE_CONFIG } from '../../../shared/features/stripe/config.js';

// SCHEMAS
import { stripeCheckoutStatusSchema } from '../../../shared/features/stripe/schemas/stripeSchemas.js';

// HELPERS
import { refundFeePayment } from './refundFeePayment.js';
import { retrievePaymentRefundState } from './retrievePaymentRefundState.js';

// UTILS
import { getStripeObjectId } from '../utils/getStripeObjectId.js';

// TYPES
import type { ActionCtx } from '../../_generated/server.js';
import type {
	StripeCheckoutSession,
	StripeWebhookEvent
} from '../../../shared/features/stripe/types/stripeTypes.js';

export async function applyFeeCheckoutSession(
	ctx: ActionCtx,
	session: StripeCheckoutSession,
	event?: StripeWebhookEvent
): Promise<void> {
	const metadata = session.metadata;
	const isAccommodationFeeCheckout =
		metadata?.purpose === STRIPE_CONFIG.feePaymentPurpose && !!metadata.paymentId;
	if (!isAccommodationFeeCheckout) return;

	const paymentIntentId = getStripeObjectId(session.payment_intent);

	const hasPaidPaymentIntent = session.payment_status === 'paid' && paymentIntentId;
	const refundState = hasPaidPaymentIntent
		? await retrievePaymentRefundState(paymentIntentId)
		: null;

	const hasMismatchedCheckoutAmountOrCurrency =
		refundState &&
		(refundState.amountMinor !== session.amount_total || refundState.currency !== session.currency);
	if (hasMismatchedCheckoutAmountOrCurrency)
		throw new Error('Stripe payment intent does not match checkout');

	const result = await ctx.runMutation(
		internal.tables.accommodationFeePayments.mutations.applyFeeCheckout.applyFeeCheckout,
		{
			paymentReference: metadata.paymentId,
			sessionId: session.id,
			clientReference: session.client_reference_id,
			amountMinor: session.amount_total,
			currency: session.currency,
			paymentIntentId,
			refundedAmountMinor: refundState?.refundedAmountMinor ?? 0,
			mode: session.mode,
			status: stripeCheckoutStatusSchema.parse(session.status),
			paymentStatus: session.payment_status,
			failed: event?.type === 'checkout.session.async_payment_failed',
			eventId: event?.id,
			eventType: event?.type
		}
	);

	if (refundState)
		await ctx.runMutation(
			internal.tables.accommodationFeePayments.mutations.applyFeeRefund.applyFeeRefund,
			refundState
		);

	const shouldRefundPayment = result.refund && result.paymentId;
	if (shouldRefundPayment) await refundFeePayment(ctx, result.paymentId);
}
