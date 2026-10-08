// CONFIG
import { STRIPE_CONFIG } from '../../../shared/features/stripe/config.js';

// HELPERS
import { getStripe } from './getStripe.js';

export function listWebhookEndpoints() {
	const stripe = getStripe();

	return stripe.webhookEndpoints.list({ limit: STRIPE_CONFIG.webhookEndpointPageSize });
}
