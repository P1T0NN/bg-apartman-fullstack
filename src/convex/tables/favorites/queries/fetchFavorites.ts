// CONVEX
import { fetchOptimizedQuery } from '../../../wrappers/fetchOptimizedQuery.js';
import { getPagination } from '../../../helpers/getPagination.js';

// AUTH
import { getOwnerId } from '../../../betterAuth/helpers/requireIdentity.js';

// HELPERS
import { withCoverUrls } from '../../accommodations/helpers/withCoverUrls.js';

// VALIDATORS
import { accommodationPage } from '../../accommodations/validators/accommodationValidators.js';

// TYPES
import type { Doc } from '../../../_generated/dataModel.js';

export const fetchFavorites = fetchOptimizedQuery({
	auth: 'user',
	returns: accommodationPage,
	fetchPage: async ({ ctx, identity, paginationOpts }) => {
		const favorites = await getPagination(
			ctx.db
				.query('favorites')
				.withIndex('by_owner_id', (q) => q.eq('ownerId', getOwnerId(identity)))
				.order('desc'),
			{ paginationOpts }
		);
		
		const accommodations = await Promise.all(
			favorites.items.map((favorite) => ctx.db.get(favorite.accommodationId))
		);

		const published = accommodations.filter(
			(accommodation): accommodation is Doc<'accommodations'> =>
				accommodation !== null && accommodation.status === 'published'
		);

		return { ...favorites, items: await withCoverUrls(published) };
	}
});
