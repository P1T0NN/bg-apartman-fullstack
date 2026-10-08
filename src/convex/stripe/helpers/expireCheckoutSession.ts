// HELPERS
import { getStripe } from './getStripe.js';

export function expireCheckoutSession(sessionId: string) {
	const stripe = getStripe();

	return stripe.checkout.sessions.expire(sessionId);
}
