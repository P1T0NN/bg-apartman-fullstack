// HELPERS
import { getStripe } from './getStripe.js';

export function verifyStripeWebhook(payload: string, signature: string) {
	const stripe = getStripe();

	const secret = process.env.STRIPE_WEBHOOK_SECRET;

	if (!secret) throw new Error('Missing STRIPE_WEBHOOK_SECRET');

	return stripe.webhooks.constructEventAsync(payload, signature, secret);
}
