// CONVEX
import { authenticatedQuery } from '../../../builders/convexFunctionBuilders.js';

// AUTH
import { getOwnerId } from '../../../betterAuth/helpers/requireIdentity.js';

// HELPERS
import { getPagination } from '../../../helpers/getPagination.js';
import { withPublishedAccommodationImageUrls } from '../helpers/enrichFavoritePage.js';

// VALIDATORS
import { listPageArgs } from '../../../validators/listPageArgs.js';
import { accommodationPage } from '../../accommodations/validators/accommodationValidators.js';

export const fetchFavorites = authenticatedQuery({
	args: listPageArgs,
	returns: accommodationPage,
	handler: async (ctx, args) => {
		const favorites = await getPagination(
			ctx.db
				.query('favorites')
				.withIndex('by_owner_id', (q) => q.eq('ownerId', getOwnerId(ctx.identity)))
				.order('desc'),
			{ paginationOpts: args.paginationOpts }
		);
		const items = await withPublishedAccommodationImageUrls({ ctx, items: favorites.items });

		return { ...favorites, items };
	}
});
