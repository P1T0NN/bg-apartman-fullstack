// LIBRARIES
import { v } from 'convex/values';

// FUNCTIONS
import { internalAction } from '../../../_generated/server.js';
import { internal } from '../../../_generated/api.js';

// VALIDATORS
import { recoveryAccess } from '../validators/bookingRecoveryTokenValidators.js';

// SCHEMAS
import { bookingEmailSchema } from '../../../../shared/features/bookings/schemas/bookingSchemas.js';

// UTILS
import { createSecret, hashSecret } from '../../../../shared/utils/secrets.js';

// TYPES
import type { BookingRecoveryAccess } from '../../../../shared/features/bookings/types/bookingTypes.js';

/** Internal only: email delivery receives the token; public requests must not return it. */
export const issueBookingRecoveryToken = internalAction({
	args: { email: v.string() },
	returns: v.union(recoveryAccess.extend({ token: v.string() }), v.null()),
	handler: async (ctx, args): Promise<(BookingRecoveryAccess & { token: string }) | null> => {
		const email = bookingEmailSchema.parse(args.email);

		const token = createSecret();

		const access = await ctx.runMutation(
			internal.tables.bookingRecoveryTokens.mutations.storeBookingRecoveryToken
				.storeBookingRecoveryToken,
			{
				email,
				tokenHash: await hashSecret(token)
			}
		);

		return access ? { ...access, token } : null;
	}
});
