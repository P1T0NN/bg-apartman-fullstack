// LIBRARIES
import { ConvexError, v } from 'convex/values';

// CONVEX
import { query } from '../../../_generated/server.js';

// HELPERS
import { getReviewPage } from '../helpers/getReviewPage.js';

// AGGREGATES
import { reviewAggregate } from '../aggregates/reviewAggregate.js';

// UTILS
import { setEmptyPagination } from '../../../../shared/features/pagination/utils/setEmptyPagination.js';

// VALIDATORS
import { listPageArgs } from '../../../validators/listPageArgs.js';
import { reviewPage } from '../validators/reviewValidators.js';
import { createReviewSchema } from '../../../../shared/features/reviews/schemas/reviewSchemas.js';

// UTILS
import { isAccommodationVisible } from '../../../../shared/features/accommodations/utils/isAccommodationVisible.js';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';

export const fetchAccommodationReviews = query({
	args: {
		...listPageArgs,
		accommodationId: v.id('accommodations'),
		rating: v.optional(v.number())
	},
	returns: reviewPage,
	handler: async (ctx, args) => {
		const accommodation = await ctx.db.get('accommodations', args.accommodationId);

		if (!isAccommodationVisible(accommodation)) {
			return setEmptyPagination(args.paginationOpts.numItems);
		}

		const rating = args.rating;

		const isInvalidRating =
			rating !== undefined &&
			!createReviewSchema.pick({ rating: true }).safeParse({ rating }).success;
		if (isInvalidRating) throw new ConvexError<BackendErrorData>({ code: 'INVALID_REVIEW' });

		const source =
			rating !== undefined
				? ctx.db
						.query('reviews')
						.withIndex('by_accommodation_id_status_rating', (q) =>
							q
								.eq('accommodationId', args.accommodationId)
								.eq('status', 'published')
								.eq('rating', rating)
						)
				: ctx.db
						.query('reviews')
						.withIndex('by_accommodation_id_status', (q) =>
							q.eq('accommodationId', args.accommodationId).eq('status', 'published')
						);

		const page = await getReviewPage(source.order('desc'), args.paginationOpts);

		return {
			...page,
			items: page.items.map(({ _id, _creationTime, authorName, stayMonth, rating, comment }) => ({
				_id,
				_creationTime,
				authorName,
				stayMonth,
				rating,
				comment
			})),
			total:
				rating !== undefined
					? undefined
					: await reviewAggregate.count(ctx, { namespace: args.accommodationId })
		};
	}
});
