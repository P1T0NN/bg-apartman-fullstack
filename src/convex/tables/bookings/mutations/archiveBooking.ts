// LIBRARIES
import { ConvexError, v } from 'convex/values';
import { authenticatedMutation } from '../../../builders/convexFunctionBuilders.js';

// HELPERS
import { getOwnerId } from '../../../betterAuth/helpers/requireIdentity.js';

// DATA
import { BOOKING_ARCHIVABLE_STATUSES } from '../../../../shared/features/bookings/data/bookingsData.js';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';

/** Hide a finished booking from its host's workspace without changing its receipt or lifecycle. */
export const archiveBooking = authenticatedMutation({
	rateLimit: { name: 'bookings:archive' },
	args: { id: v.id('bookings') },
	returns: v.null(),
	handler: async (ctx, args) => {
		const booking = await ctx.db.get('bookings', args.id);

		if (!booking || booking.hostId !== getOwnerId(ctx.identity)) {
			throw new ConvexError<BackendErrorData>({ code: 'BOOKING_NOT_FOUND' });
		}

		const canArchive = BOOKING_ARCHIVABLE_STATUSES.includes(booking.status);
		
		if (!canArchive) {
			throw new ConvexError<BackendErrorData>({ code: 'INVALID_BOOKING_STATUS' });
		}

		if (booking.hostArchivedAt === undefined) {
			await ctx.db.patch('bookings', args.id, { hostArchivedAt: Date.now() });
		}
		return null;
	}
});
