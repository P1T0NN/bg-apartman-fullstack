// TYPES
import type { StaySearch } from '../types/searchTypes.js';

export function clearSearchFilters(criteria: StaySearch): StaySearch {
	return {
		...criteria,
		minPrice: 0,
		maxPrice: 0,
		type: '' as const,
		bedrooms: 0,
		beds: 0,
		bathrooms: 0,
		amenities: []
	};
}
