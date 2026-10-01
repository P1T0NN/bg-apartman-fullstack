// LIBRARIES
import { docValidator } from 'convex/server';
import { v } from 'convex/values';

// SCHEMAS
import { reviews } from '../schema.js';

export const publicReview = docValidator('reviews', reviews).pick(
	'_id',
	'_creationTime',
	'authorName',
	'stayMonth',
	'rating',
	'comment'
);

export const reviewSummary = v.object({
	count: v.number(),
	average: v.union(v.number(), v.null()),
	distribution: v.array(v.number())
});

export const reviewPage = v.object({
	items: v.array(publicReview),
	nextCursor: v.union(v.string(), v.null()),
	hasNextPage: v.boolean(),
	pageSize: v.number(),
	total: v.optional(v.number())
});

export const myReview = publicReview.extend({
	bookingId: v.id('bookings'),
	accommodationId: v.id('accommodations'),
	status: reviews.validator.fields.status,
	accommodationName: v.union(v.string(), v.null()),
	checkInDate: v.union(v.string(), v.null()),
	checkOutDate: v.union(v.string(), v.null())
});
