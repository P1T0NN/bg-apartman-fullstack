// DATA
import {
	DEFAULT_SEARCH,
	OPTIONAL_FILTER_KEYS,
	type StaySearch
} from '@/features/search/data/searchCriteria.js';

// UTILS
import { m } from '@/lib/paraglide/messages';

/**
 * Shared search-page criteria and map state, provided through
 * `setSearchContext` so SearchFilters and the page read one source without
 * prop drilling. State is returned as getters — destructuring would snapshot it.
 */
export function useSearchCriteria({ hasLocation }: { hasLocation: () => boolean }) {
	let criteria = $state<StaySearch>(structuredClone(DEFAULT_SEARCH));
	let showMap = $state(false);

	const sorts = $derived([
		{ value: 'recommended', label: m['SearchPage.SearchFilters.recommended']() },
		{ value: 'price-asc', label: m['SearchPage.SearchFilters.priceAsc']() },
		{ value: 'price-desc', label: m['SearchPage.SearchFilters.priceDesc']() },
		{ value: 'rating', label: m['SearchPage.SearchFilters.rating']() },
		{ value: 'distance', label: m['SearchPage.SearchFilters.distance']() }
	]);
	const labels = $derived({
		minPrice: m['SearchPage.SearchFilters.minPrice']({ currency: 'EUR' }),
		maxPrice: m['SearchPage.SearchFilters.maxPrice']({ currency: 'EUR' }),
		type: m['SearchPage.SearchFilters.type'](),
		bedrooms: m['SearchPage.SearchFilters.bedrooms'](),
		beds: m['SearchPage.SearchFilters.beds'](),
		bathrooms: m['SearchPage.SearchFilters.bathrooms'](),
		amenities: m['SearchPage.SearchFilters.amenities'](),
		pets: m['SearchPage.SearchFilters.pets'](),
		rating: m['SearchPage.SearchFilters.rating'](),
		cancellation: m['SearchPage.SearchFilters.cancellation']()
	});
	const activeFilters = $derived(
		OPTIONAL_FILTER_KEYS.filter((key) =>
			Array.isArray(criteria[key]) ? criteria[key].length > 0 : Boolean(criteria[key])
		)
	);
	const isLocationKnown = $derived(hasLocation());
	const mapVisible = $derived(showMap && isLocationKnown);

	return {
		get criteria() {
			return criteria;
		},
		get sorts() {
			return sorts;
		},
		get labels() {
			return labels;
		},
		get activeFilters() {
			return activeFilters;
		},
		get hasLocation() {
			return isLocationKnown;
		},
		get showMap() {
			return showMap;
		},
		get mapVisible() {
			return mapVisible;
		},
		setCriteria(value: StaySearch) {
			criteria = value;
		},
		toggleMap() {
			showMap = !showMap;
		}
	};
}
