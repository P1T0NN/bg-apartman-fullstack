// LIBRARIES
import { ConvexError, v } from 'convex/values';

// BUILDERS
import { authenticatedMutation } from '../../../builders/convexFunctionBuilders.js';

// AUTH
import { getOwnerId } from '../../../betterAuth/helpers/requireIdentity.js';

// AGGREGATES
import { reviewAggregate } from '../aggregates/reviewAggregate.js';

// HELPERS
import { updateAccommodationReviewSortKeys } from '../../accommodations/helpers/updateAccommodationReviewSortKeys.js';

// SCHEMAS
import { createReviewSchema } from '../../../../shared/features/reviews/schemas/reviewSchemas.js';

// UTILS
import { canReviewBooking } from '../../../../shared/features/reviews/utils/canReviewBooking.js';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';

export const createReview = authenticatedMutation({
	rateLimit: { name: 'reviews:create' },
	args: { bookingId: v.id('bookings'), rating: v.number(), comment: v.string() },
	returns: v.id('reviews'),
	handler: async (ctx, args) => {
		const ownerId = getOwnerId(ctx.identity);
		const booking = await ctx.db.get('bookings', args.bookingId);
		if (!booking || booking.ownerId !== ownerId)
			throw new ConvexError<BackendErrorData>({ code: 'BOOKING_NOT_FOUND' });
		const existing = await ctx.db
			.query('reviews')
			.withIndex('by_booking_id', (q) => q.eq('bookingId', booking._id))
			.unique();
		if (existing || booking.reviewId)
			throw new ConvexError<BackendErrorData>({ code: 'REVIEW_ALREADY_EXISTS' });
		const now = Date.now();
		const isEligible = canReviewBooking(booking, now);
		if (!isEligible) throw new ConvexError<BackendErrorData>({ code: 'REVIEW_NOT_ELIGIBLE' });
		const accommodation = await ctx.db.get('accommodations', booking.accommodationId);
		if (!accommodation || accommodation.status !== 'published')
			throw new ConvexError<BackendErrorData>({ code: 'ACCOMMODATION_NOT_FOUND' });
		if (accommodation.ownerId === ownerId)
			throw new ConvexError<BackendErrorData>({ code: 'FORBIDDEN' });
		const parsed = createReviewSchema.safeParse(args);
		if (!parsed.success) throw new ConvexError<BackendErrorData>({ code: 'INVALID_REVIEW' });
		const id = await ctx.db.insert('reviews', {
			bookingId: booking._id,
			accommodationId: booking.accommodationId,
			ownerId,
			authorName: (ctx.identity.name?.trim().split(/\s+/)[0] || booking.firstName.trim()).slice(
				0,
				80
			),
			stayMonth: booking.checkInDate.slice(0, 7),
			rating: parsed.data.rating,
			comment: parsed.data.comment,
			status: 'published'
		});
		const stored = await ctx.db.get('reviews', id);
		if (stored) await reviewAggregate.insert(ctx, stored);
		await updateAccommodationReviewSortKeys(ctx, booking.accommodationId);
		await ctx.db.patch('bookings', booking._id, { reviewId: id });
		return id;
	}
});
