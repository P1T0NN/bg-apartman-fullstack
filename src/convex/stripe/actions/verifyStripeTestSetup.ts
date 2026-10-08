'use node';

// LIBRARIES
import { v } from 'convex/values';

// CONVEX
import { internalAction } from '../../_generated/server.js';

// CONFIG
import { STRIPE_CONFIG } from '../../../shared/features/stripe/config.js';

// HELPERS
import { getStripe } from '../helpers/getStripe.js';

/** Read-only setup check; test access does not establish live business or settlement eligibility. */
export const verifyStripeTestSetup = internalAction({
	args: {},
	returns: v.object({
		livemode: v.literal(false),
		country: v.union(v.string(), v.null()),
		defaultCurrency: v.union(v.string(), v.null()),
		chargesEnabled: v.boolean(),
		payoutsEnabled: v.boolean(),
		detailsSubmitted: v.boolean()
	}),
	handler: async () => {
		const hasTestKey = STRIPE_CONFIG.testKeyPattern.test(process.env.STRIPE_SECRET_KEY ?? '');
		if (!hasTestKey) throw new Error('A Stripe test-mode key is required for this setup check.');

		const stripe = getStripe();
		const balance = await stripe.balance.retrieve();
		if (balance.livemode)
			throw new Error('Stripe returned live-mode data; test setup was not verified.');

		const account = await stripe.accounts.retrieve(null);

		return {
			livemode: false as const,
			country: account.country ?? null,
			defaultCurrency: account.default_currency ?? null,
			chargesEnabled: account.charges_enabled,
			payoutsEnabled: account.payouts_enabled,
			detailsSubmitted: account.details_submitted
		};
	}
});
