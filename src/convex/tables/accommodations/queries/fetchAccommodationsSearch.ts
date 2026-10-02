// CONVEX
import { v } from 'convex/values';
import { literals } from 'convex-helpers/validators';
import { query } from '../../../_generated/server.js';
import { getPagination } from '../../../helpers/getPagination.js';
import { getOwnerId } from '../../../betterAuth/helpers/requireIdentity.js';

// HELPERS
import { buildAccommodationSearchQuery } from '../helpers/buildAccommodationSearchQuery.js';
import { resolveImageUrls } from '../utils/resolveImageUrls.js';
import { getFavoriteIds } from '../../favorites/helpers/getFavoriteIds.js';
import { getAccommodationReviewSummaries } from '../../reviews/helpers/getAccommodationReviewSummaries.js';

// DATA
import { EMPTY_REVIEW_SUMMARY } from '../../../../shared/features/reviews/data/reviewsData.js';

// CONFIG
import { ACCOMMODATION_CONFIG } from '../../../../shared/features/accommodations/config.js';
import { ACCOMMODATION_SORTS } from '../../../../shared/features/accommodations/types/accommodationTypes.js';

// UTILS
import { setEmptyPagination } from '../../../../shared/features/pagination/utils/setEmptyPagination.js';

// VALIDATORS
import { listPageArgs } from '../../../validators/listPageArgs.js';
import {
	searchCriteriaArgs,
	accommodationSearchPage
} from '../validators/accommodationValidators.js';
import { boundsSchema } from '../../../../shared/features/accommodations/schemas/accommodationSchemas.js';

export const fetchAccommodationsSearch = query({
	args: {
		...listPageArgs,
		...searchCriteriaArgs,
		sort: v.optional(literals(...ACCOMMODATION_SORTS))
	},
	returns: accommodationSearchPage,
	handler: async (ctx, args) => {
		const { paginationOpts } = args;
		const bounds = args.bounds ? boundsSchema.parse(args.bounds) : undefined;

		const accommodationsQuery = buildAccommodationSearchQuery(ctx, {
			...args,
			bounds,
			sort: args.sort ?? 'recommended'
		});

		if (!accommodationsQuery) {
			return { ...setEmptyPagination(paginationOpts.numItems), favoriteIds: [] };
		}

		const page = await getPagination(accommodationsQuery, {
			paginationOpts: {
				...paginationOpts,
				maximumRowsRead: Math.min(
					paginationOpts.maximumRowsRead ?? ACCOMMODATION_CONFIG.searchMaximumRowsRead,
					ACCOMMODATION_CONFIG.searchMaximumRowsRead
				)
			}
		});

		const items = await resolveImageUrls(page.items);
		const identity = await ctx.auth.getUserIdentity();

		const [summaries, favoriteIds] = await Promise.all([
			getAccommodationReviewSummaries(
				ctx,
				items.map((item) => item._id)
			),
			identity
				? getFavoriteIds(
						ctx,
						getOwnerId(identity),
						items.map((item) => item._id)
					)
				: []
		]);

		return {
			...page,
			items: items.map((item, index) => ({
				...item,
				reviews: summaries[index] ?? EMPTY_REVIEW_SUMMARY
			})),
			favoriteIds
		};
	}
});
