<script lang="ts">
	// COMPONENTS
	import NativeSelect from '@/components/ui/native-components/native-select/native-select.svelte';

	// HOOKS
	import { getSearchContext } from '@/features/search/context/searchContext.js';

	// DATA
	import { ACCOMMODATION_SORTS } from '@/shared/features/accommodations/types/accommodationTypes.js';

	// UTILS
	import { m } from '@/lib/paraglide/messages';

	const search = getSearchContext();
</script>

<NativeSelect
	label={m['SearchPage.SearchToolbarSortSelect.sort']()}
	options={[
		{ value: 'recommended', label: m['SearchPage.SearchToolbarSortSelect.recommended']() },
		{ value: 'price-asc', label: m['SearchPage.SearchToolbarSortSelect.priceAsc']() },
		{ value: 'price-desc', label: m['SearchPage.SearchToolbarSortSelect.priceDesc']() },
		{ value: 'guest-rating', label: m['SearchPage.SearchToolbarSortSelect.guestRating']() }
	]}
	value={search.criteria.sort}
	onchange={(value) => {
		const sort = ACCOMMODATION_SORTS.find((sort) => sort === value);
		if (sort) search.setSort(sort);
	}}
	includePlaceholderOption={false}
/>
