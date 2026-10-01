// LIBRARIES
import { ConvexError, v } from 'convex/values';
import { z } from 'zod';

// BUILDERS
import { authenticatedQuery } from '../../../builders/convexFunctionBuilders.js';

// AUTH
import { getOwnerId } from '../../../betterAuth/helpers/requireIdentity.js';

// HELPERS
import { getReviewPage } from '../helpers/getReviewPage.js';

// CONFIG
import { REVIEWS_CONFIG } from '../../../../shared/features/reviews/config.js';
import { DAY_IN_MS } from '../../../../shared/utils/date.js';

// UTILS
import { setEmptyPagination } from '../../../../shared/features/pagination/utils/setEmptyPagination.js';

// VALIDATORS
import { listPageArgs } from '../../../validators/listPageArgs.js';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';

export const fetchEligibleReviewBookings = authenticatedQuery({
	args: { ...listPageArgs, accommodationId: v.id('accommodations'), today: v.string() },
	returns: v.object({
		items: v.array(
			v.object({ _id: v.id('bookings'), checkInDate: v.string(), checkOutDate: v.string() })
		),
		nextCursor: v.union(v.string(), v.null()),
		hasNextPage: v.boolean(),
		pageSize: v.number()
	}),
	handler: async (ctx, args) => {
		if (!z.iso.date().safeParse(args.today).success)
			throw new ConvexError<BackendErrorData>({ code: 'INVALID_REVIEW' });
		const ownerId = getOwnerId(ctx.identity);
		const accommodation = await ctx.db.get('accommodations', args.accommodationId);
		const isUnavailable =
			!accommodation || accommodation.status !== 'published' || accommodation.ownerId === ownerId;
		if (isUnavailable) return setEmptyPagination(args.paginationOpts.numItems);
		const oldest = new Date(Date.parse(args.today) - REVIEWS_CONFIG.REVIEW_WINDOW_DAYS * DAY_IN_MS)
			.toISOString()
			.slice(0, 10);
		// Client date controls presentation only; createReview checks the server clock again.
		const page = await getReviewPage(
			ctx.db
				.query('bookings')
				.withIndex('by_owner_id_accommodation_id_status_review_id_check_out_date', (q) =>
					q
						.eq('ownerId', ownerId)
						.eq('accommodationId', args.accommodationId)
						.eq('status', 'completed')
						.eq('reviewId', undefined)
						.gt('checkOutDate', oldest)
						.lte('checkOutDate', args.today)
				)
				.order('desc'),
			args.paginationOpts
		);
		return {
			...page,
			items: page.items
				.filter((booking) => booking.hostId !== ownerId)
				.map(({ _id, checkInDate, checkOutDate }) => ({ _id, checkInDate, checkOutDate }))
		};
	}
});
