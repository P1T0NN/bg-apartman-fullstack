// LIBRARIES
import { docValidator } from 'convex/server';
import { v } from 'convex/values';

// SCHEMAS
import { bookings, bookingCancellationTerms } from '../schema.js';

const bookingDoc = docValidator('bookings', bookings);

/** Guest-facing details returned only after verifying recovery access. */
export const recoveredBooking = bookingDoc
	.pick(
		'_id',
		'accommodationId',
		'status',
		'firstName',
		'lastName',
		'email',
		'phone',
		'specialRequests',
		'checkInDate',
		'checkOutDate',
		'adults',
		'children'
	)
	.extend({
		accommodationName: v.string(),
		isClaimable: v.boolean(),
		cancellationTerms: bookingCancellationTerms
	});

export const recoveredBookingPage = v.object({
	items: v.array(recoveredBooking),
	nextCursor: v.union(v.string(), v.null()),
	hasNextPage: v.boolean(),
	pageSize: v.number()
});

export const bookingItem = bookingDoc.extend({
	accommodation: v.union(
		v.object({
			name: v.string(),
			city: v.string(),
			country: v.string(),
			imageUrl: v.union(v.string(), v.null())
		}),
		v.null()
	)
});

export const bookingPage = v.object({
	items: v.array(bookingItem),
	nextCursor: v.union(v.string(), v.null()),
	hasNextPage: v.boolean(),
	pageSize: v.number()
});

/** Exact per-status counts for the host's whole pipeline, independent of the active filters. */
export const bookingStatusCounts = v.object({
	pending: v.number(),
	confirmed: v.number(),
	declined: v.number(),
	cancelled: v.number(),
	expired: v.number(),
	completed: v.number()
});

export const hostBookingPage = v.object({
	items: v.array(bookingItem),
	nextCursor: v.union(v.string(), v.null()),
	hasNextPage: v.boolean(),
	pageSize: v.number()
});

/** Non-identifying booking summary for the public confirmation page. */
export const bookingConfirmation = v.object({
	status: bookings.validator.fields.status,
	accommodationId: v.id('accommodations'),
	accommodationName: v.string(),
	cancellationTerms: bookingCancellationTerms,
	checkInDate: v.string(),
	checkOutDate: v.string(),
	adults: v.number(),
	children: v.number()
});
