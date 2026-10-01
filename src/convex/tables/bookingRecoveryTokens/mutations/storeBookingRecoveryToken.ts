// LIBRARIES
import { v } from 'convex/values';

// FUNCTIONS
import { internalMutation } from '../../../_generated/server.js';

// VALIDATORS
import { recoveryAccess } from '../validators/bookingRecoveryTokenValidators.js';

// CONFIG
import { BOOKINGS_CONFIG } from '../../../../shared/features/bookings/config.js';

// SCHEMAS
import { bookingEmailSchema } from '../../../../shared/features/bookings/schemas/bookingSchemas.js';

export const storeBookingRecoveryToken = internalMutation({
	args: { email: v.string(), tokenHash: v.string() },
	returns: v.union(recoveryAccess, v.null()),
	handler: async (ctx, args) => {
		const email = bookingEmailSchema.parse(args.email);

		const booking = await ctx.db
			.query('bookings')
			.withIndex('by_email_check_out_date', (q) => q.eq('email', email))
			.first();

		if (!booking) return null;

		const existing = await ctx.db
			.query('bookingRecoveryTokens')
			.withIndex('by_token_hash', (q) => q.eq('tokenHash', args.tokenHash))
			.unique();

		if (existing) return null;

		const expiresAt = Date.now() + BOOKINGS_CONFIG.RECOVERY_TOKEN_LIFETIME_MS;

		await ctx.db.insert('bookingRecoveryTokens', { email, tokenHash: args.tokenHash, expiresAt });

		return { email, expiresAt };
	}
});
