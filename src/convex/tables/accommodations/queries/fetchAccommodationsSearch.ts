// LIBRARIES
import { v } from 'convex/values';
import { z } from 'zod';

// CONVEX
import { fetchOptimizedQuery } from '../../../wrappers/fetchOptimizedQuery.js';
import { getPagination } from '../../../helpers/getPagination.js';
import { getOwnerId } from '../../../betterAuth/helpers/requireIdentity.js';

// HELPERS
import { withCoverUrls } from '../helpers/withCoverUrls.js';
import { getFavoriteIds } from '../../favorites/helpers/getFavoriteIds.js';

// VALIDATORS
import { accommodationSearchPage } from '../validators/accommodationValidators.js';

const boundsSchema = z
	.object({
		south: z.number().min(-90).max(90),
		north: z.number().min(-90).max(90),
		west: z.number().min(-180).max(180),
		east: z.number().min(-180).max(180)
	})
	.refine((bounds) => bounds.south <= bounds.north);

export const fetchAccommodationsSearch = fetchOptimizedQuery({
	args: {
		bounds: v.optional(
			v.object({
				south: v.number(),
				north: v.number(),
				west: v.number(),
				east: v.number()
			})
		),
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
		const country = args.location.country?.trim() ?? '';
		const guests = (args.adults ?? 0) + (args.children ?? 0);
		const bedrooms = args.rooms ?? 0;
		const bounds = args.bounds ? boundsSchema.parse(args.bounds) : undefined;

		if (!country && !bounds) {
			return {
				items: [],
				nextCursor: null,
				hasNextPage: false,
				pageSize: paginationOpts.numItems,
				favoriteIds: []
			};
		}

		// The viewport replaces the destination scope so panning across cities works.
		// ponytail: latitude narrows reads; add a spatial index if dense latitude bands outgrow this.
		let accommodations = bounds
			? ctx.db
					.query('accommodations')
					.withIndex('by_latitude', (q) =>
						q.gte('latitude', bounds.south).lte('latitude', bounds.north)
					)
			: city
				? ctx.db
						.query('accommodations')
						.withIndex('by_address_country_city', (q) =>
							q.eq('address.country', country).eq('address.city', city)
						)
				: ctx.db
						.query('accommodations')
						.withIndex('by_address_country_city', (q) => q.eq('address.country', country));

		if (bounds) {
			accommodations = accommodations.filter((q) => {
				const west = q.gte(q.field('longitude'), bounds.west);
				const east = q.lte(q.field('longitude'), bounds.east);
				return bounds.west <= bounds.east ? q.and(west, east) : q.or(west, east);
			});
		}

		const hasCountMinimums = guests > 0 || bedrooms > 0;

		const page = await getPagination(
			hasCountMinimums
				? accommodations.filter((q) =>
						q.and(q.gte(q.field('maxGuests'), guests), q.gte(q.field('bedrooms'), bedrooms))
					)
				: accommodations,
			{
				paginationOpts: {
					...paginationOpts,
					maximumRowsRead: Math.min(paginationOpts.maximumRowsRead ?? 1000, 1000),
					maximumBytesRead: Math.min(paginationOpts.maximumBytesRead ?? 2_000_000, 2_000_000)
				}
			}
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
