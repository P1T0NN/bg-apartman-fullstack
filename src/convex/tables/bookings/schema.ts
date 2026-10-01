// LIBRARIES
import { literals } from 'convex-helpers/validators';
import { defineTable } from 'convex/server';
import { v } from 'convex/values';

// CONFIG
import { BOOKING_STATUSES } from '../../../shared/features/bookings/schemas/bookingSchemas.js';

export const bookings = defineTable({
	// Set server-side when a signed-in guest books; also used to claim anonymous bookings.
	ownerId: v.optional(v.string()),
	// Owner of the booked accommodation, copied at creation; powers the host bookings page.
	hostId: v.optional(v.string()),
	// Booking request lifecycle; every new booking starts as 'pending'.
	status: literals(...BOOKING_STATUSES),
	// Retained even when a review is moderated: each stay earns only one review.
	reviewId: v.optional(v.id('reviews')),
	completedAt: v.optional(v.number()),
	completedBy: v.optional(v.string()),
	completionNote: v.optional(v.string()),
	// Lowercased "<lastName> <email>" maintained by booking writes; powers guest search.
	searchText: v.optional(v.string()),
	accommodationId: v.id('accommodations'),
	firstName: v.string(),
	lastName: v.string(),
	// Trimmed and lowercased; recovery lookup uses exact indexed matching.
	email: v.string(),
	phone: v.string(),
	specialRequests: v.optional(v.string()),
	checkInDate: v.string(), // ISO date, e.g. "2026-10-01".
	checkOutDate: v.string(), // ISO date, e.g. "2026-10-05"; the departure day.
	adults: v.number(),
	children: v.number()
})
	.index('by_email_check_out_date', ['email', 'checkOutDate'])
	// Retained for _creationTime ordering; guest list queries sort newest first.
	// eslint-disable-next-line @convex-dev/no-duplicate-indexes
	.index('by_owner_id', ['ownerId'])
	.index('by_owner_id_accommodation_id_status_review_id_check_out_date', [
		'ownerId',
		'accommodationId',
		'status',
		'reviewId',
		'checkOutDate'
	])
	// Retained for _creationTime ordering; host list queries sort newest first.
	// eslint-disable-next-line @convex-dev/no-duplicate-indexes
	.index('by_host_id', ['hostId'])
	.index('by_host_id_status', ['hostId', 'status'])
	.searchIndex('search_guest', {
		searchField: 'searchText',
		filterFields: ['ownerId', 'hostId', 'status']
	});
