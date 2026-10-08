// CONFIG
import { STRIPE_CONFIG } from '../../../shared/features/stripe/config.js';

// HELPERS
import { getStripe } from './getStripe.js';

export function createFeeWebhookEndpoint(url: string) {
	return getStripe().webhookEndpoints.create(
		{
			url,
			enabled_events: [...STRIPE_CONFIG.feeWebhookEvents],
			description: 'BG Apartman accommodation flat-fee payments (development)'
		},
		{ idempotencyKey: `bgapartman-fee-webhook:${url}` }
	);
}
