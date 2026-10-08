'use node';

// LIBRARIES
import { v } from 'convex/values';

// CONVEX
import { internalAction } from '../../_generated/server.js';

// CONFIG
import { STRIPE_CONFIG } from '../../../shared/features/stripe/config.js';

// HELPERS
import { getStripe } from '../helpers/getStripe.js';
import { listWebhookEndpoints } from '../helpers/listWebhookEndpoints.js';
import { createFeeWebhookEndpoint } from '../helpers/createFeeWebhookEndpoint.js';

/** Deployment operator only: consume the new secret privately and store it as STRIPE_WEBHOOK_SECRET. */
export const configureStripeTestWebhook = internalAction({
	args: {},
	returns: v.object({ id: v.string(), url: v.string(), secret: v.union(v.string(), v.null()) }),
	handler: async () => {
		const testKey = STRIPE_CONFIG.testKeyPattern.test(process.env.STRIPE_SECRET_KEY ?? '');

		const isTestModeSetup = testKey && !(await getStripe().balance.retrieve()).livemode;
		if (!isTestModeSetup) throw new Error('Only test-mode webhook setup is allowed');

		const site = process.env.CONVEX_SITE_URL;
		if (!site) throw new Error('Missing CONVEX_SITE_URL');

		const url = new URL(STRIPE_CONFIG.webhookPath, site).toString();

		const endpoints = await listWebhookEndpoints();

		const existing = endpoints.data.find((endpoint) => endpoint.url === url);

		if (existing) return { id: existing.id, url, secret: null };

		if (endpoints.has_more)
			throw new Error('Review paginated webhook endpoints before creating another');

		const endpoint = await createFeeWebhookEndpoint(url);
		if (!endpoint.secret) throw new Error('Stripe did not return a new webhook secret');

		return { id: endpoint.id, url, secret: endpoint.secret };
	}
});
