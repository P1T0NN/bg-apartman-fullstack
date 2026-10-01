// LIBRARIES
import { ConvexError, v } from 'convex/values';

// BUILDERS
import { adminMutation } from '../../../builders/convexFunctionBuilders.js';

// AUTH
import { getOwnerId } from '../../../betterAuth/helpers/requireIdentity.js';

// HELPERS
import { completeBooking } from '../helpers/completeBooking.js';

// SCHEMAS
import { completeBookingAdminSchema } from '../../../../shared/features/bookings/schemas/bookingSchemas.js';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';

/** Support can resolve a verified checkout when a host has not completed the stay. */
export const completeBookingAdmin = adminMutation({
	rateLimit: { name: 'bookings:complete-admin' },
	args: { bookingId: v.id('bookings'), reason: v.string() },
	returns: v.null(),
	handler: async (ctx, args) => {
		const parsed = completeBookingAdminSchema.safeParse(args);
		if (!parsed.success) throw new ConvexError<BackendErrorData>({ code: 'INVALID_BOOKING' });
		const booking = await ctx.db.get('bookings', args.bookingId);
		if (!booking) throw new ConvexError<BackendErrorData>({ code: 'BOOKING_NOT_FOUND' });
		await completeBooking(ctx, booking, getOwnerId(ctx.identity), parsed.data.reason);
		return null;
	}
});
