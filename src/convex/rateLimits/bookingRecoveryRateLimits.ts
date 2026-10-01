// LIBRARIES
import { HOUR, MINUTE } from '@convex-dev/rate-limiter';

// CONFIG
import { BOOKINGS_CONFIG } from '../../shared/features/bookings/config.js';

// TYPES
import type { FunctionRateLimit } from './types/rateLimitTypes.js';

export const BOOKING_RECOVERY_REQUEST_RATE_LIMIT = {
	name: 'bookingRecovery:request',
	silent: true,
	config: { kind: 'token bucket', rate: 60, period: MINUTE, capacity: 20 }
} satisfies FunctionRateLimit;

export const BOOKING_RECOVERY_EMAIL_COOLDOWN_RATE_LIMIT = {
	name: 'bookingRecovery:request:email:cooldown',
	config: {
		kind: 'token bucket',
		rate: 1,
		period: BOOKINGS_CONFIG.RECOVERY_RESEND_COOLDOWN_MS,
		capacity: 1
	}
} satisfies Pick<FunctionRateLimit, 'name' | 'config'>;

export const BOOKING_RECOVERY_EMAIL_HOURLY_RATE_LIMIT = {
	name: 'bookingRecovery:request:email:hourly',
	config: {
		kind: 'token bucket',
		rate: BOOKINGS_CONFIG.RECOVERY_REQUESTS_PER_HOUR,
		period: HOUR,
		capacity: BOOKINGS_CONFIG.RECOVERY_REQUESTS_PER_HOUR
	}
} satisfies Pick<FunctionRateLimit, 'name' | 'config'>;
