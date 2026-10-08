'use node';

// LIBRARIES
import { v } from 'convex/values';

// CONVEX
import { internalAction } from '../../_generated/server.js';

// CONFIG
import { STRIPE_CONFIG } from '../../../shared/features/stripe/config.js';

// HELPERS
import { listWebhookEndpoints } from '../helpers/listWebhookEndpoints.js';

export const verifyStripeWebhookSetup = internalAction({
	args: {},
	returns: v.object({
		url: v.string(),
		endpoints: v.array(
			v.object({ id: v.string(), status: v.string(), enabledEvents: v.array(v.string()) })
		),
		hasMore: v.boolean()
	}),
	handler: async () => {
		const site = process.env.CONVEX_SITE_URL;

		if (!site) throw new Error('Missing CONVEX_SITE_URL');

		const url = new URL(STRIPE_CONFIG.webhookPath, site).toString();
		const endpoints = await listWebhookEndpoints();

		return {
			url,
			endpoints: endpoints.data
				.filter((endpoint) => endpoint.url === url)
				.map((endpoint) => ({
					id: endpoint.id,
					status: endpoint.status,
					enabledEvents: endpoint.enabled_events
				})),
			hasMore: endpoints.has_more
		};
	}
});
