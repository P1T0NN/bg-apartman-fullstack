// LIBRARIES
import { MINUTE } from '@convex-dev/rate-limiter';
import { v } from 'convex/values';

// BUILDERS
import { action } from '../../../builders/convexFunctionBuilders.js';

// CONVEX
import { internal } from '../../../_generated/api.js';

// CONFIG
import { NEWSLETTER_SUBSCRIBE_CAPTCHA_ACTION } from '../../../../shared/features/captcha/config.js';

// SCHEMAS
import { subscribeToNewsletterSchema } from '../../../../shared/features/newsletters/schemas/newsletterSchemas.js';

// TURNSTILE
import { verifyTurnstileToken } from '../../../turnstile/verifyTurnstile.js';

/** Every response takes at least this long so timing cannot reveal whether the email exists. */
const MIN_RESPONSE_DURATION_MS = 2_000;

/**
 * Public newsletter signup. Captcha verification needs `fetch`, so the public
 * entry point is an action; the subscriber row is written by the internal mutation.
 *
 * Anti-enumeration: this action never throws and always resolves after at least
 * `MIN_RESPONSE_DURATION_MS`, whether the address is new, existing, invalid,
 * failed the captcha, or was silently throttled.
 */
export const subscribeToNewsletter = action({
	rateLimit: {
		name: 'newsletters:subscribe',
		scope: 'global',
		silent: true,
		config: { kind: 'token bucket', rate: 60, period: MINUTE, capacity: 20 }
	},
	args: { email: v.string(), turnstileToken: v.optional(v.string()) },
	returns: v.null(),
	handler: async (ctx, args): Promise<null> => {
		const startedAt = Date.now();

		try {
			if (ctx.rateLimitOk) {
				const parsed = subscribeToNewsletterSchema.safeParse({ email: args.email });

				if (parsed.success) {
					await verifyTurnstileToken(
						args.turnstileToken ?? '',
						NEWSLETTER_SUBSCRIBE_CAPTCHA_ACTION
					);
					await ctx.runMutation(
						internal.tables.newsletters.mutations.upsertNewsletterSubscriber
							.upsertNewsletterSubscriber,
						{ email: parsed.data.email }
					);
				}
			}
		} catch (error) {
			// Deliberately swallowed: no failure path may change the response.
			console.error('Newsletter subscription attempt failed', error);
		}

		const remainingDelay = MIN_RESPONSE_DURATION_MS - (Date.now() - startedAt);
		if (remainingDelay > 0) await new Promise((resolve) => setTimeout(resolve, remainingDelay));

		return null;
	}
});
