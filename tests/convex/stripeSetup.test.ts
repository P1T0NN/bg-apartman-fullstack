/// <reference types="vite/client" />

// LIBRARIES
import { convexTest } from 'convex-test';
import { makeFunctionReference } from 'convex/server';
import { afterEach, expect, test, vi } from 'vitest';

// SCHEMAS
import schema from '../../src/convex/schema.js';

// HELPERS
import { getStripe } from '../../src/convex/stripe/helpers/getStripe.js';

const modules = import.meta.glob('../../src/convex/**/*.ts');
const verifySetup = makeFunctionReference<'action'>(
	'stripe/actions/verifyStripeTestSetup:verifyStripeTestSetup'
);

afterEach(() => {
	vi.unstubAllEnvs();
	vi.unstubAllGlobals();
});

test('missing Stripe configuration fails when used rather than on import', () => {
	vi.stubEnv('STRIPE_SECRET_KEY', '');
	expect(() => getStripe()).toThrow('Missing STRIPE_SECRET_KEY');
});

test.each(['', 'sk_live_fixture', 'rk_live_fixture', 'invalid_fixture'])(
	'the setup check rejects missing or non-test credentials before making requests (%s)',
	async (key) => {
		vi.stubEnv('STRIPE_SECRET_KEY', key);
		const fetch = vi.fn();
		vi.stubGlobal('fetch', fetch);
		await expect(convexTest(schema, modules).action(verifySetup, {})).rejects.toThrow(
			'A Stripe test-mode key is required'
		);
		expect(fetch).not.toHaveBeenCalled();
	}
);

test.each(['sk_test_fixture', 'rk_test_fixture'])(
	'test setup returns only account readiness fields using read-only requests (%s)',
	async (key) => {
		vi.stubEnv('STRIPE_SECRET_KEY', key);
		const fetch = vi.fn(async (url: string, init: RequestInit) => {
			expect(init.method).toBe('GET');
			if (url === 'https://api.stripe.com/v1/balance')
				return new Response(JSON.stringify({ object: 'balance', livemode: false }));
			expect(url).toBe('https://api.stripe.com/v1/account');
			return new Response(
				JSON.stringify({
					object: 'account',
					country: 'FR',
					default_currency: 'eur',
					charges_enabled: false,
					payouts_enabled: false,
					details_submitted: false,
					email: 'private@example.com',
					external_accounts: { data: [{ id: 'private_bank_account' }] }
				})
			);
		});
		vi.stubGlobal('fetch', fetch);
		expect(await convexTest(schema, modules).action(verifySetup, {})).toEqual({
			livemode: false,
			country: 'FR',
			defaultCurrency: 'eur',
			chargesEnabled: false,
			payoutsEnabled: false,
			detailsSubmitted: false
		});
		expect(fetch).toHaveBeenCalledTimes(2);
	}
);

test('live provider data cannot pass test verification even with a test-prefixed credential', async () => {
	vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_fixture');
	const fetch = vi.fn(
		async () => new Response(JSON.stringify({ object: 'balance', livemode: true }))
	);
	vi.stubGlobal('fetch', fetch);
	await expect(convexTest(schema, modules).action(verifySetup, {})).rejects.toThrow(
		'Stripe returned live-mode data'
	);
	expect(fetch).toHaveBeenCalledTimes(1);
});
