// SCHEMAS
import { stripeChargeRefundSchema } from '../../../shared/features/stripe/schemas/stripeSchemas.js';

// HELPERS
import { getStripe } from './getStripe.js';

export async function retrievePaymentRefundState(paymentIntentId: string) {
	const stripe = getStripe();

	const intent = await stripe.paymentIntents.retrieve(paymentIntentId, {
		expand: ['latest_charge']
	});

	const charge = stripeChargeRefundSchema.parse(intent.latest_charge);

	return {
		paymentIntentId: intent.id,
		amountMinor: charge.amount,
		currency: charge.currency,
		refundedAmountMinor: charge.amount_refunded
	};
}
