// LIBRARIES
import { literals } from 'convex-helpers/validators';
import { ConvexError, v } from 'convex/values';

// BUILDERS
import { authenticatedMutation } from '../../../builders/convexFunctionBuilders.js';

// AUTH
import { getOwnerId } from '../../../betterAuth/helpers/requireIdentity.js';

// CONFIG
import {
	BOOKING_STATUSES,
	BOOKING_STATUS_TRANSITIONS
} from '../../../../shared/features/bookings/schemas/bookingSchemas.js';

// TYPES
import type { BookingStatus } from '../../../../shared/features/bookings/schemas/bookingSchemas.js';
import type { BackendErrorData } from '../../../../shared/types/types.js';

/** Host lifecycle actions: confirm or decline a request, cancel or complete a confirmed stay. */
export const updateBookingStatus = authenticatedMutation({
	rateLimit: { name: 'bookings:update-status' },
	args: {
		id: v.id('bookings'),
		status: literals(...BOOKING_STATUSES)
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const booking = await ctx.db.get(args.id);
		if (!booking || booking.hostId !== getOwnerId(ctx.identity)) {
			throw new ConvexError<BackendErrorData>({ code: 'BOOKING_NOT_FOUND' });
		}

		const allowedTransitions: readonly BookingStatus[] = BOOKING_STATUS_TRANSITIONS[booking.status];
		const isAllowedTransition = allowedTransitions.includes(args.status);
		if (!isAllowedTransition) {
			throw new ConvexError<BackendErrorData>({ code: 'INVALID_BOOKING_STATUS' });
		}

		await ctx.db.patch(args.id, { status: args.status });

		return null;
	}
});
