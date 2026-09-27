// LIBRARIES
import type { RateLimitConfig } from '@convex-dev/rate-limiter';

export type RateLimitScope = 'actor' | 'global';

export type FunctionRateLimit = {
	name: string;
	config?: RateLimitConfig;
	count?: number;
	scope?: RateLimitScope;
	/**
	 * Consume the limit without throwing, reporting the outcome as `rateLimitOk`
	 * on the function context. Use for anti-enumeration flows that must return
	 * the same response whether or not the call was throttled.
	 */
	silent?: boolean;
};

export type RateLimitedFunctionOptions = {
	rateLimit?: FunctionRateLimit;
};
