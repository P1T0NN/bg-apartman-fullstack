// LIBRARIES
import { v } from 'convex/values';

// CONVEX
import { fetchOptimizedQuery } from '../../../wrappers/fetchOptimizedQuery.js';
import { getPagination } from '../../../helpers/getPagination.js';
import { getOwnerId } from '../../../betterAuth/helpers/requireIdentity.js';

// HELPERS
import { withCoverUrls } from '../helpers/withCoverUrls.js';
import { getFavoriteIds } from '../../favorites/helpers/getFavoriteIds.js';

// VALIDATORS
import { accommodationSearchPage } from '../validators/accommodationValidators.js';

export const fetchAccommodationsSearch = fetchOptimizedQuery({
	args: {
		location: v.object({
			city: v.optional(v.string()),
			country: v.optional(v.string())
		}),
		adults: v.optional(v.number()),
		children: v.optional(v.number()),
		rooms: v.optional(v.number())
	},
	returns: accommodationSearchPage,
	fetchPage: async ({ ctx, args, paginationOpts }) => {
		const city = args.location.city?.trim();
		const country = args.location.country?.trim();
		const guests = (args.adults ?? 0) + (args.children ?? 0);
		const bedrooms = args.rooms ?? 0;

		if (!country) {
			return {
				items: [],
				nextCursor: null,
				hasNextPage: false,
				pageSize: paginationOpts.numItems,
				favoriteIds: []
			};
		}

		const accommodations = city
			? ctx.db
					.query('accommodations')
					.withIndex('by_address_country_city', (q) =>
						q.eq('address.country', country).eq('address.city', city)
					)
			: ctx.db
					.query('accommodations')
					.withIndex('by_address_country_city', (q) => q.eq('address.country', country));

		const hasCountMinimums = guests > 0 || bedrooms > 0;

		const page = await getPagination(
			hasCountMinimums
				? accommodations.filter((q) =>
						q.and(q.gte(q.field('maxGuests'), guests), q.gte(q.field('bedrooms'), bedrooms))
					)
				: accommodations,
			{ paginationOpts }
		);

		const identity = await ctx.auth.getUserIdentity();
		const favoriteIds = identity
			? await getFavoriteIds(
					ctx,
					getOwnerId(identity),
					page.items.map((item) => item._id)
				)
			: [];

		return { ...page, items: await withCoverUrls(page.items), favoriteIds };
	}
});
