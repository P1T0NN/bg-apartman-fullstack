// LIBRARIES
import { v } from 'convex/values';
// BUILDERS
import { authenticatedQuery } from '../../../builders/convexFunctionBuilders.js';
// HELPERS
import { getBookingToClaim } from '../helpers/getBookingToClaim.js';
import { getBookingGuestDetails } from '../helpers/getBookingGuestDetails.js';
// VALIDATORS
import { recoveredBooking } from '../validators/bookingValidators.js';

export const fetchBookingToClaim = authenticatedQuery({
	args: { bookingId: v.id('bookings'), token: v.string() },
	returns: recoveredBooking,
	handler: async (ctx, args) => {
		const { booking } = await getBookingToClaim(ctx, args.bookingId, args.token);
		return getBookingGuestDetails(ctx, booking);
	}
});
