// LIBRARIES
import Stripe from 'stripe';

/** Resolve deployment secrets when called, so missing payment setup does not block other features. */
export function getStripe() {
	const secretKey = process.env.STRIPE_SECRET_KEY;
	if (!secretKey) throw new Error('Missing STRIPE_SECRET_KEY');

	return new Stripe(secretKey, { httpClient: Stripe.createFetchHttpClient() });
}
