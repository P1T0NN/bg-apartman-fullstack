// HELPERS
import { getStripe } from './getStripe.js';

export function createPaymentRefund(
	paymentIntentId: string,
	amountMinor: number,
	idempotencyKey: string
) {
	const stripe = getStripe();

	return stripe.refunds.create(
		{ payment_intent: paymentIntentId, amount: amountMinor },
		{ idempotencyKey }
	);
}
