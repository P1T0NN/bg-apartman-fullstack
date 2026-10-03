// HOOKS
import { useSearchParams } from '@/hooks/useSearchParams.svelte.js';

// DATA
import { DEFAULT_SEARCH, OPTIONAL_FILTER_KEYS } from '@/features/search/data/searchCriteria.js';
import { ACCOMMODATION_SORTS } from '@/shared/features/accommodations/data/accommodationsData.js';

// TYPES
import type { StaySearch } from '@/shared/features/search/types/searchTypes.js';
import type { AccommodationSort } from '@/shared/features/accommodations/types/accommodationTypes.js';

/**
 * Shared search-page criteria and map state, provided through
 * `setSearchContext` so SearchFilters and the page read one source without
 * prop drilling. State is returned as getters — destructuring would snapshot it.
 */
export function useSortAccommodations({ hasLocation }: { hasLocation: () => boolean }) {
	const params = useSearchParams(['sort'], { history: 'push' });

	const { sort: _defaultSort, ...defaultFilters } = $state.snapshot(DEFAULT_SEARCH);

	let filters = $state(defaultFilters);
	let showMap = $state(false);

	const sort = $derived.by(() => {
		const value = params.get('sort');
		return ACCOMMODATION_SORTS.find((sort) => sort === value) ?? DEFAULT_SEARCH.sort;
	});

	const criteria = $derived({ ...filters, sort });

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
		setCriteria({ sort: _sort, ...value }: StaySearch) {
			filters = value;
		},
		setSort(value: AccommodationSort) {
			params.write({ sort: value === DEFAULT_SEARCH.sort ? '' : value });
		},
		toggleMap() {
			showMap = !showMap;
		}
	};
}
