// CONVEX
import type { QueryCtx } from '../../../_generated/server.js';

// TYPES
import type { AccommodationBounds } from '../../../../shared/features/accommodations/schemas/accommodationSchemas.js';

export const SEARCH_MAXIMUM_ROWS_READ = 1000;

type AccommodationSearchArgs = {
	bounds?: AccommodationBounds;
	location: { city?: string; country?: string };
	adults?: number;
	children?: number;
	rooms?: number;
};

export function buildAccommodationSearchQuery(ctx: QueryCtx, args: AccommodationSearchArgs) {
	const city = args.location.city?.trim();
	const country = args.location.country?.trim() ?? '';
	const guests = (args.adults ?? 0) + (args.children ?? 0);
	const bedrooms = args.rooms ?? 0;
	const bounds = args.bounds;

	if (!country && !bounds) return null;

	// The viewport replaces the destination scope so panning across cities works.
	// ponytail: latitude narrows reads; add a spatial index if dense latitude bands outgrow this.
	let accommodationsQuery = bounds
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
		accommodationsQuery = accommodationsQuery.filter((q) => {
			const west = q.gte(q.field('longitude'), bounds.west);
			const east = q.lte(q.field('longitude'), bounds.east);
			return bounds.west <= bounds.east ? q.and(west, east) : q.or(west, east);
		});
	}

	const hasCountMinimums = guests > 0 || bedrooms > 0;
	return hasCountMinimums
		? accommodationsQuery.filter((q) =>
				q.and(q.gte(q.field('maxGuests'), guests), q.gte(q.field('bedrooms'), bedrooms))
			)
		: accommodationsQuery;
}
