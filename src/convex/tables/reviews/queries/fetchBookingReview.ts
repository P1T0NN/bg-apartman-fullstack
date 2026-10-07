// LIBRARIES
import { ConvexError, v } from 'convex/values';

// BUILDERS
import { authenticatedQuery } from '../../../builders/convexFunctionBuilders.js';

// AUTH
import { getOwnerId } from '../../../betterAuth/helpers/requireIdentity.js';

// VALIDATORS
import { publicReview } from '../validators/reviewValidators.js';

// UTILS
import { isAccommodationVisible } from '../../../../shared/features/accommodations/utils/isAccommodationVisible.js';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';

export const fetchBookingReview = authenticatedQuery({
	args: { bookingId: v.id('bookings') },
	returns: v.object({
		accommodationId: v.id('accommodations'),
		accommodationName: v.union(v.string(), v.null()),
		checkInDate: v.string(),
		checkOutDate: v.string(),
		status: v.string(),
		ownerId: v.string(),
		hostId: v.optional(v.string()),
		reviewId: v.optional(v.id('reviews')),
		review: v.union(
			publicReview.extend({ status: v.union(v.literal('published'), v.literal('hidden')) }),
			v.null()
		)
	}),
	handler: async (ctx, args) => {
		const booking = await ctx.db.get('bookings', args.bookingId);
		const ownerId = getOwnerId(ctx.identity);
		if (!booking || booking.ownerId !== ownerId)
			throw new ConvexError<BackendErrorData>({ code: 'BOOKING_NOT_FOUND' });
		const accommodation = await ctx.db.get('accommodations', booking.accommodationId);
		const review = await ctx.db
			.query('reviews')
			.withIndex('by_booking_id', (q) => q.eq('bookingId', booking._id))
			.unique();
		return {
			accommodationId: booking.accommodationId,
			accommodationName: isAccommodationVisible(accommodation) ? accommodation.name : null,
			checkInDate: booking.checkInDate,
			checkOutDate: booking.checkOutDate,
			status: booking.status,
			ownerId,
			hostId: accommodation?.ownerId === ownerId ? ownerId : booking.hostId,
			reviewId: booking.reviewId,
			review: review
				? {
						_id: review._id,
						_creationTime: review._creationTime,
						authorName: review.authorName,
						stayMonth: review.stayMonth,
						rating: review.rating,
						comment: review.comment,
						status: review.status
					}
				: null
		};
	}
});
