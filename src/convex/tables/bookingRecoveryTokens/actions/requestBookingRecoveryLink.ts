// LIBRARIES
import { ConvexError, v } from 'convex/values';
import { internal } from '../../../_generated/api.js';

// CONFIG
import { BOOKINGS_CONFIG } from '../../../../shared/features/bookings/config.js';

// RATE LIMITS
import {
	checkBookingRecoveryEmailCooldown,
	checkBookingRecoveryEmailHourlyLimit
} from '../ratelimiting/bookingRecoveryTokenRateLimits.js';

// UTILS
import { hashSecret } from '../../../../shared/utils/secrets.js';
import { action } from '../../../builders/convexFunctionBuilders.js';

// SCHEMAS
import { requestBookingRecoveryLinkSchema } from '../../../../shared/features/bookingsRecoveryTokens/schemas/bookingRecoveryTokenSchemas.js';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';

// RATE LIMIT POLICY
import { BOOKING_RECOVERY_REQUEST_RATE_LIMIT } from '../../../rateLimits/bookingRecoveryRateLimits.js';

/** Valid requests acknowledge processing, never booking existence or email delivery. */
export const requestBookingRecoveryLink = action({
	rateLimit: BOOKING_RECOVERY_REQUEST_RATE_LIMIT,
	args: { email: v.string(), locale: v.string() },
	returns: v.null(),
	handler: async (ctx, args): Promise<null> => {
		const startedAt = Date.now();

		const parsed = requestBookingRecoveryLinkSchema.safeParse(args);

		if (!parsed.success) {
			throw new ConvexError<BackendErrorData>({ code: 'INVALID_BOOKING_RECOVERY_REQUEST' });
		}

		if (ctx.rateLimitOk) {
			// Destination scope is derived from normalized input, never a browser-supplied actor ID.
			const key = await hashSecret(parsed.data.email);

			const checkEmailCooldown = await checkBookingRecoveryEmailCooldown(ctx, key);
			const checkEmailHourlyLimit = checkEmailCooldown
				? await checkBookingRecoveryEmailHourlyLimit(ctx, key)
				: false;

			const canRequest = checkEmailCooldown && checkEmailHourlyLimit;

			if (canRequest) {
				// Queue the same work for matching/nonmatching emails; provider latency stays private.
				await ctx.scheduler.runAfter(
					0,
					internal.tables.bookingRecoveryTokens.actions.deliverBookingRecoveryLink
						.deliverBookingRecoveryLink,
					parsed.data
				);
			}
		}

		const remainingDelay =
			BOOKINGS_CONFIG.RECOVERY_REQUEST_MIN_DURATION_MS - (Date.now() - startedAt);

		if (remainingDelay > 0) {
			await new Promise((resolve) => setTimeout(resolve, remainingDelay));
		}

		return null;
	}
});
