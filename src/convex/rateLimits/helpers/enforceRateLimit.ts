// LIBRARIES
import {
	RateLimiter,
	type RateLimitArgs,
	type RateLimitConfig,
	type RunMutationCtx
} from '@convex-dev/rate-limiter';
import { components } from '../../_generated/api.js';

// CONFIG
import {
	DEFAULT_RATE_LIMIT_CONFIGS,
	DEFAULT_RATE_LIMIT_NAME,
	GLOBAL_BACKSTOP_MULTIPLIER,
	MAX_ANONYMOUS_KEY_LENGTH
} from '../ratelimit.config.js';

// TYPES
import type { UserIdentity } from 'convex/server';
import type { MutationCtx } from '../../_generated/server.js';
import type { FunctionRateLimit } from '../types/rateLimitTypes.js';

type RateLimitContext = RunMutationCtx & Pick<MutationCtx, 'auth'>;
type NamedLimit = { name: string; config: RateLimitConfig };

const rateLimiter = new RateLimiter(components.rateLimiter);

function scaleLimit(config: RateLimitConfig, multiplier: number): RateLimitConfig {
	return {
		...config,
		rate: config.rate * multiplier,
		capacity: (config.capacity ?? config.rate) * multiplier
	};
}

async function consumeLimits(
	ctx: RateLimitContext,
	limits: NamedLimit[],
	key: string | undefined,
	count: number | undefined,
	throws: boolean
): Promise<boolean> {
	for (const limit of limits) {
		const options: Omit<RateLimitArgs, 'name'> = { config: limit.config, throws };
		if (key !== undefined) options.key = key;
		if (count !== undefined) options.count = count;

		const result = await rateLimiter.limit(ctx, limit.name, options);
		if (!result.ok) return false;
	}

	return true;
}

/**
 * Consume a rate-limit token before a public mutation or action runs.
 *
 * Authenticated callers are keyed by identity. Anonymous callers are keyed by
 * the browser guest id they sent (fairness per browser) and additionally by a
 * looser global ceiling that backstops id rotation. Calls without a guest id
 * only consume that global backstop.
 */
export async function enforceRateLimit(
	ctx: RateLimitContext,
	rateLimit?: FunctionRateLimit,
	identity?: UserIdentity,
	guestId?: string
): Promise<boolean> {
	const name = rateLimit?.name ?? DEFAULT_RATE_LIMIT_NAME;

	if (name.trim().length === 0) throw new Error('Rate-limit name must not be empty');

	const customConfig = rateLimit?.config;
	const limits =
		customConfig === undefined
			? DEFAULT_RATE_LIMIT_CONFIGS.map(({ suffix, config }) => ({
					name: `${name}:${suffix}`,
					config
				}))
			: [{ name, config: customConfig }];

	const count = rateLimit?.count;
	const throws = rateLimit?.silent !== true;

	const actorIdentity = identity ?? (await ctx.auth.getUserIdentity());

	if (actorIdentity !== null) {
		return consumeLimits(ctx, limits, actorIdentity.subject, count, throws);
	}

	const guestKey = guestId?.trim();
	const isUsableGuestKey =
		guestKey !== undefined && guestKey.length > 0 && guestKey.length <= MAX_ANONYMOUS_KEY_LENGTH;
	if (isUsableGuestKey) {
		const guestOk = await consumeLimits(ctx, limits, guestKey, count, throws);
		if (!guestOk) return false;
	}

	const backstopLimits = limits.map((limit) => ({
		name: `${limit.name}:global`,
		config: scaleLimit(limit.config, GLOBAL_BACKSTOP_MULTIPLIER)
	}));

	return consumeLimits(ctx, backstopLimits, undefined, count, throws);
}
