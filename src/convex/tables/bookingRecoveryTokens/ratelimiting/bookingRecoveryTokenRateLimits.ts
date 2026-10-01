// LIBRARIES
import { RateLimiter, type RunMutationCtx } from '@convex-dev/rate-limiter';
import { components } from '../../../_generated/api.js';

// CONFIG
import {
	BOOKING_RECOVERY_EMAIL_COOLDOWN_RATE_LIMIT,
	BOOKING_RECOVERY_EMAIL_HOURLY_RATE_LIMIT
} from '../../../rateLimits/bookingRecoveryRateLimits.js';

const rateLimiter = new RateLimiter(components.rateLimiter);

/** The key is the hash of the normalized destination email, not a browser actor ID. */
export async function checkBookingRecoveryEmailCooldown(
	ctx: RunMutationCtx,
	key: string
): Promise<boolean> {
	const result = await rateLimiter.limit(ctx, BOOKING_RECOVERY_EMAIL_COOLDOWN_RATE_LIMIT.name, {
		key,
		config: BOOKING_RECOVERY_EMAIL_COOLDOWN_RATE_LIMIT.config
	});
	return result.ok;
}

export async function checkBookingRecoveryEmailHourlyLimit(
	ctx: RunMutationCtx,
	key: string
): Promise<boolean> {
	const result = await rateLimiter.limit(ctx, BOOKING_RECOVERY_EMAIL_HOURLY_RATE_LIMIT.name, {
		key,
		config: BOOKING_RECOVERY_EMAIL_HOURLY_RATE_LIMIT.config
	});
	return result.ok;
}
