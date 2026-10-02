// TYPES
import type { AmenityKey } from '@/shared/features/accommodations/types/amenityTypes.js';
import type { AccommodationSort } from '@/shared/features/accommodations/types/accommodationTypes.js';

// Stay filters are local; sort, destination, dates, and guests are read from the URL.
export const DEFAULT_SEARCH = {
	minPrice: 0,
	maxPrice: 0,
	type: '',
	bedrooms: 0,
	beds: 0,
	bathrooms: 0,
	amenities: new Array<AmenityKey>(),
	// SAFETY: Recommended is supported; widen the default to allow both price directions.
	sort: 'recommended' as AccommodationSort
};

export const OPTIONAL_FILTER_KEYS = [
	'minPrice',
	'maxPrice',
	'type',
	'bedrooms',
	'beds',
	'bathrooms',
	'amenities'
] as const;
