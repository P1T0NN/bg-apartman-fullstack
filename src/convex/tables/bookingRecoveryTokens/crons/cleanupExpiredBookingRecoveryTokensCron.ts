// LIBRARIES
import { v } from 'convex/values';

// FUNCTIONS
import { internalMutation } from '../../../_generated/server.js';
import { internal } from '../../../_generated/api.js';

// CONFIG
import { BOOKINGS_CONFIG } from '../../../../shared/features/bookings/config.js';

/** Delete bounded expiry-index batches; deletions invalidate the tokens' booking subscriptions. */
export const cleanupExpiredBookingRecoveryTokensCron = internalMutation({
	args: {},
	returns: v.number(),
	handler: async (ctx) => {
		const tokens = await ctx.db
			.query('bookingRecoveryTokens')
			.withIndex('by_expires_at', (q) => q.lte('expiresAt', Date.now()))
			.take(BOOKINGS_CONFIG.RECOVERY_TOKEN_CLEANUP_BATCH_SIZE);

		for (const token of tokens) await ctx.db.delete('bookingRecoveryTokens', token._id);

		if (tokens.length === BOOKINGS_CONFIG.RECOVERY_TOKEN_CLEANUP_BATCH_SIZE) {
			await ctx.scheduler.runAfter(
				0,
				internal.tables.bookingRecoveryTokens.crons.cleanupExpiredBookingRecoveryTokensCron
					.cleanupExpiredBookingRecoveryTokensCron,
				{}
			);
		}
		return tokens.length;
	}
});
