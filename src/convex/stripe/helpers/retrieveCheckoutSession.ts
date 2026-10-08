// HELPERS
import { getStripe } from './getStripe.js';

export function retrieveCheckoutSession(sessionId: string) {
	const stripe = getStripe();

	return stripe.checkout.sessions.retrieve(sessionId);
}
