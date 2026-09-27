// LIBRARIES
import { docValidator } from 'convex/server';
import { v } from 'convex/values';

// SCHEMAS
import { bookings } from '../schema.js';

const bookingDoc = docValidator('bookings', bookings);

export const bookingPage = v.object({
	items: v.array(bookingDoc),
	nextCursor: v.union(v.string(), v.null()),
	hasNextPage: v.boolean(),
	pageSize: v.number(),
	total: v.optional(v.number())
});

/** Non-identifying booking summary for the public confirmation page. */
export const bookingConfirmation = v.object({
	accommodationId: v.id('accommodations'),
	accommodationName: v.string(),
	checkInDate: v.string(),
	checkOutDate: v.string(),
	adults: v.number(),
	children: v.number()
});
