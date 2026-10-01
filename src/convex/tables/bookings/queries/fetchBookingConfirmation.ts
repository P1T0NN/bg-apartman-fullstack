// LIBRARIES
import { v } from 'convex/values';

// CONVEX
import { query } from '../../../_generated/server.js';

// VALIDATORS
import { bookingConfirmation } from '../validators/bookingValidators.js';

/**
 * Public confirmation lookup: the booking id in the guest's URL acts as the
 * capability token, and only non-identifying stay details are returned.
 */
export const fetchBookingConfirmation = query({
	args: { id: v.id('bookings') },
	returns: v.union(bookingConfirmation, v.null()),
	handler: async (ctx, { id }) => {
		const booking = await ctx.db.get('bookings', id);
		if (!booking) return null;

		const accommodation = await ctx.db.get('accommodations', booking.accommodationId);
		if (!accommodation) return null;

		return {
			accommodationId: booking.accommodationId,
			accommodationName: accommodation.name,
			checkInDate: booking.checkInDate,
			checkOutDate: booking.checkOutDate,
			adults: booking.adults,
			children: booking.children
		};
	}
});
