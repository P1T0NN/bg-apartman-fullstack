// Local filter/sort criteria for the search page; destination, dates, and guests live in the URL.
export const DEFAULT_SEARCH = {
	minPrice: 0,
	maxPrice: 0,
	type: '',
	bedrooms: 0,
	beds: 0,
	bathrooms: 0,
	amenities: new Array<string>(),
	pets: false,
	rating: 0,
	cancellation: false,
	sort: 'recommended'
};
export type StaySearch = typeof DEFAULT_SEARCH;

export function clearSearchFilters(criteria: StaySearch): StaySearch {
	return {
		...criteria,
		minPrice: 0,
		maxPrice: 0,
		type: '' as const,
		bedrooms: 0,
		beds: 0,
		bathrooms: 0,
		amenities: [],
		pets: false,
		rating: 0,
		cancellation: false
	};
}

export const OPTIONAL_FILTER_KEYS = [
	'minPrice',
	'maxPrice',
	'type',
	'bedrooms',
	'beds',
	'bathrooms',
	'rating',
	'amenities',
	'pets',
	'cancellation'
] as const;
