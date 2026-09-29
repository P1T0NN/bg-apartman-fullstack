// CONVEX
import { query } from '../../../_generated/server.js';
import { getPagination } from '../../../helpers/getPagination.js';
import { getOwnerId } from '../../../betterAuth/helpers/requireIdentity.js';

// HELPERS
import {
	buildAccommodationSearchQuery,
	SEARCH_MAXIMUM_ROWS_READ
} from '../helpers/buildAccommodationSearchQuery.js';
import { resolveImageUrls } from '../utils/resolveImageUrls.js';
import { getFavoriteIds } from '../../favorites/helpers/getFavoriteIds.js';

// VALIDATORS
import { listPageArgs } from '../../../validators/listPageArgs.js';
import { searchCriteriaArgs, accommodationSearchPage } from '../validators/accommodationValidators.js';
import { boundsSchema } from '../../../../shared/features/accommodations/schemas/accommodationSchemas.js';

export const fetchAccommodationsSearch = query({
	args: {
		...listPageArgs,
		...searchCriteriaArgs
	},
	returns: accommodationSearchPage,
	handler: async (ctx, args) => {
		const { paginationOpts } = args;
		const bounds = args.bounds ? boundsSchema.parse(args.bounds) : undefined;
		const accommodationsQuery = buildAccommodationSearchQuery(ctx, { ...args, bounds });

		if (!accommodationsQuery) {
			return {
				items: [],
				nextCursor: null,
				hasNextPage: false,
				pageSize: paginationOpts.numItems,
				favoriteIds: []
			};
		}

		const page = await getPagination(accommodationsQuery, {
			paginationOpts: {
				...paginationOpts,
				maximumRowsRead: Math.min(
					paginationOpts.maximumRowsRead ?? SEARCH_MAXIMUM_ROWS_READ,
					SEARCH_MAXIMUM_ROWS_READ
				)
			}
		});

		const identity = await ctx.auth.getUserIdentity();
		const favoriteIds = identity
			? await getFavoriteIds(
					ctx,
					getOwnerId(identity),
					page.items.map((item) => item._id)
				)
			: [];

		return { ...page, items: await resolveImageUrls(page.items), favoriteIds };
	}
});
