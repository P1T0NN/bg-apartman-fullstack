// LIBRARIES
import { filter } from 'convex-helpers/server/filter';
import type { OrderedQuery } from 'convex/server';

// HELPERS
import { getAccommodationsByRecommendedSort } from './getAccommodationsByRecommendedSort.js';
import { getAccommodationsByGuestRatingSort } from './getAccommodationsByGuestRatingSort.js';
import { getAccommodationsByPriceSort } from './getAccommodationsByPriceSort.js';

// SCHEMAS
import { accommodationSearchFiltersSchema } from '../../../../shared/features/accommodations/schemas/accommodationSchemas.js';

// TYPES
import type { QueryCtx } from '../../../_generated/server.js';
import type { DataModel } from '../../../_generated/dataModel.js';
import type { AccommodationSort } from '../../../../shared/features/accommodations/types/accommodationTypes.js';
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
	sort?: AccommodationSort;
};

export function buildAccommodationSearchQuery(ctx: QueryCtx, args: AccommodationSearchArgs) {
	const city = args.location.city?.trim();
	const country = args.location.country?.trim() ?? '';
	const guests = (args.adults ?? 0) + (args.children ?? 0);
	const filters = accommodationSearchFiltersSchema.parse(args.stayFilters ?? {});
	const bedrooms = Math.max(args.rooms ?? 0, filters.bedrooms ?? 0);
	const bounds = args.bounds;
	const { type, minPrice = 0, maxPrice = 0, beds = 0, bathrooms = 0 } = filters;

	if (!country && !bounds) return null;

	// The viewport replaces the destination scope so panning across cities works.
	const sortCountry = bounds ? undefined : country;
	const sortCity = bounds ? undefined : city;

	// ponytail: sorted viewports scan the ordering index in bounded pages; add spatial partitions if scans get costly.
	let accommodationsQuery: OrderedQuery<DataModel['accommodations']>;

	if (args.sort === 'recommended') {
		accommodationsQuery = getAccommodationsByRecommendedSort(ctx, sortCountry, sortCity);
	} else if (args.sort === 'guest-rating') {
		accommodationsQuery = getAccommodationsByGuestRatingSort(ctx, sortCountry, sortCity);
	} else if (args.sort === 'price-asc' || args.sort === 'price-desc') {
		accommodationsQuery = getAccommodationsByPriceSort(
			ctx,
			args.sort === 'price-asc' ? 'asc' : 'desc',
			sortCountry,
			sortCity
		);
	} else if (bounds) {
		// Map pins need geographic membership, independently of list ordering.
		accommodationsQuery = ctx.db
			.query('accommodations')
			.withIndex('by_latitude', (q) =>
				q.gte('latitude', bounds.south).lte('latitude', bounds.north)
			);
	} else if (city) {
		accommodationsQuery = ctx.db
			.query('accommodations')
			.withIndex('by_address_country_city', (q) =>
				q.eq('address.country', country).eq('address.city', city)
			);
	} else {
		accommodationsQuery = ctx.db
			.query('accommodations')
			.withIndex('by_address_country_city', (q) => q.eq('address.country', country));
	}

	if (bounds) {
		// Exclude longitude misses before paginating map pins, preserving existing map pages.
		accommodationsQuery = accommodationsQuery.filter((q) => {
			const west = q.gte(q.field('longitude'), bounds.west);
			const east = q.lte(q.field('longitude'), bounds.east);
			return q.and(
				q.gte(q.field('latitude'), bounds.south),
				q.lte(q.field('latitude'), bounds.north),
				bounds.west <= bounds.east ? q.and(west, east) : q.or(west, east)
			);
		});
	}

	const hasCountMinimums = guests > 0 || bedrooms > 0;
	if (hasCountMinimums) {
		accommodationsQuery = accommodationsQuery.filter((q) =>
			q.and(q.gte(q.field('maxGuests'), guests), q.gte(q.field('bedrooms'), bedrooms))
		);
	}

	if (type) accommodationsQuery = accommodationsQuery.filter((q) => q.eq(q.field('type'), type));

	if (minPrice)
		accommodationsQuery = accommodationsQuery.filter((q) =>
			q.gte(q.field('pricePerNightMinor'), Math.round(minPrice * 100))
		);

	if (maxPrice)
		accommodationsQuery = accommodationsQuery.filter((q) =>
			q.lte(q.field('pricePerNightMinor'), Math.round(maxPrice * 100))
		);

	if (beds) accommodationsQuery = accommodationsQuery.filter((q) => q.gte(q.field('beds'), beds));

	if (bathrooms)
		accommodationsQuery = accommodationsQuery.filter((q) => q.gte(q.field('bathrooms'), bathrooms));

	const amenities = filters.amenities ?? [];
	return amenities.length
		? filter(accommodationsQuery, (item) => amenities.every((key) => item.amenities.includes(key)))
		: accommodationsQuery;
}
