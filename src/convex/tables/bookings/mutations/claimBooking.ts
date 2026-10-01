// LIBRARIES
import { v } from 'convex/values';
// BUILDERS
import { authenticatedMutation } from '../../../builders/convexFunctionBuilders.js';
// HELPERS
import { getBookingToClaim } from '../helpers/getBookingToClaim.js';
// AGGREGATES
import { bookingOwnerAggregate } from '../aggregates/bookingOwnerAggregate.js';

export const claimBooking = authenticatedMutation({
	args: { bookingId: v.id('bookings'), token: v.string() },
	returns: v.null(),
	handler: async (ctx, args) => {
		const { booking, ownerId } = await getBookingToClaim(ctx, args.bookingId, args.token);
		if (booking.ownerId === ownerId) return null;
		await ctx.db.patch('bookings', booking._id, { ownerId });
		await bookingOwnerAggregate.insert(ctx, { ...booking, ownerId });
		return null;
	}
});
