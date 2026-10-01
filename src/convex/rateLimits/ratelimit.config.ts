// LIBRARIES
import { HOUR, MINUTE, type RateLimitConfig } from '@convex-dev/rate-limiter';

export const DEFAULT_RATE_LIMIT_NAME = 'publicFunction';

/**
 * Anonymous callers are keyed by the browser guest id. That id is rotatable, so
 * every anonymous limit also consumes a looser global ceiling at this multiple,
 * which caps id rotation without affecting normal per-guest traffic.
 */
export const GLOBAL_BACKSTOP_MULTIPLIER = 10;

/** Bound untrusted anonymous keys before they reach the limiter's storage. */
export const MAX_ANONYMOUS_KEY_LENGTH = 128;

export const DEFAULT_RATE_LIMIT_CONFIGS = [
	{
		suffix: 'minute',
		config: { kind: 'fixed window', rate: 20, period: MINUTE, capacity: 20 }
	},
	{
		suffix: 'fiveMinutes',
		config: { kind: 'fixed window', rate: 60, period: 5 * MINUTE, capacity: 60 }
	},
	{
		suffix: 'hour',
		config: { kind: 'fixed window', rate: 300, period: HOUR, capacity: 300 }
	}
] as const satisfies ReadonlyArray<{ suffix: string; config: RateLimitConfig }>;
