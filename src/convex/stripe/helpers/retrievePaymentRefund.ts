// HELPERS
import { getStripe } from './getStripe.js';

export function retrievePaymentRefund(refundId: string) {
	const stripe = getStripe();

	return stripe.refunds.retrieve(refundId);
}
