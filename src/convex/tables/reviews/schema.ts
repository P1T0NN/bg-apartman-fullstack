// LIBRARIES
import { defineTable } from 'convex/server';
import { v } from 'convex/values';
import { literals } from 'convex-helpers/validators';

export const reviews = defineTable({
	bookingId: v.id('bookings'),
	accommodationId: v.id('accommodations'),
	ownerId: v.string(),
	authorName: v.string(),
	stayMonth: v.string(),
	rating: v.number(),
	comment: v.string(),
	status: literals('published', 'hidden'),
	moderatedBy: v.optional(v.string()),
	moderatedAt: v.optional(v.number()),
	moderationReason: v.optional(v.string())
})
	.index('by_booking_id', ['bookingId'])
	.index('by_owner_id', ['ownerId'])
	// Retained for _creationTime ordering; public review lists sort newest first.
	// eslint-disable-next-line @convex-dev/no-duplicate-indexes
	.index('by_accommodation_id_status', ['accommodationId', 'status'])
	.index('by_accommodation_id_status_rating', ['accommodationId', 'status', 'rating'])
	.index('by_status', ['status']);
