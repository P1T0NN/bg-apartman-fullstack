// LIBRARIES
import { filter } from 'convex-helpers/server/filter';

// CONVEX
import type { QueryCtx } from '../../../_generated/server.js';

// SCHEMAS
import { accommodationSearchFiltersSchema } from '../../../../shared/features/accommodations/schemas/accommodationSchemas.js';

// TYPES
import type {
	AccommodationBounds,
	AccommodationSearchFilters
} from '../../../../shared/features/accommodations/schemas/accommodationSchemas.js';

type AccommodationSearchArgs = {
	bounds?: AccommodationBounds;
	location: { city?: string; country?: string };
	adults?: number;
	children?: number;
	rooms?: number;
	stayFilters?: AccommodationSearchFilters;
};

export function buildAccommodationSearchQuery(ctx: QueryCtx, args: AccommodationSearchArgs) {
	const city = args.location.city?.trim();
	const country = args.location.country?.trim() ?? '';
	const guests = (args.adults ?? 0) + (args.children ?? 0);
	const filters = accommodationSearchFiltersSchema.parse(args.stayFilters ?? {});
	const { type, minPrice = 0, maxPrice = 0, beds = 0, bathrooms = 0 } = filters;
	const bedrooms = Math.max(args.rooms ?? 0, filters.bedrooms ?? 0);
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
	if (hasCountMinimums) {
		accommodationsQuery = accommodationsQuery.filter((q) =>
			q.and(q.gte(q.field('maxGuests'), guests), q.gte(q.field('bedrooms'), bedrooms))
		);
	}
	if (type) {
		accommodationsQuery = accommodationsQuery.filter((q) => q.eq(q.field('type'), type));
	}
	if (minPrice) {
		accommodationsQuery = accommodationsQuery.filter((q) =>
			q.gte(q.field('pricePerNightMinor'), Math.round(minPrice * 100))
		);
	}
	if (maxPrice) {
		accommodationsQuery = accommodationsQuery.filter((q) =>
			q.lte(q.field('pricePerNightMinor'), Math.round(maxPrice * 100))
		);
	}
	if (beds) {
		accommodationsQuery = accommodationsQuery.filter((q) => q.gte(q.field('beds'), beds));
	}
	if (bathrooms) {
		accommodationsQuery = accommodationsQuery.filter((q) => q.gte(q.field('bathrooms'), bathrooms));
	}
	const amenities = filters.amenities ?? [];
	// Filter the bounded indexed page, preserving its cursor even when no rows match.
	return amenities.length
		? filter(accommodationsQuery, (item) => amenities.every((key) => item.amenities.includes(key)))
		: accommodationsQuery;
}
