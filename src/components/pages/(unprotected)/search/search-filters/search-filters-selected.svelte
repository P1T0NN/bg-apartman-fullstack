<script lang="ts">
	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// HOOKS
	import { getSearchContext } from '@/features/search/context/searchContext.js';

	// UTILS
	import { m } from '@/lib/paraglide/messages';
	import { getAmenities } from '@/shared/features/accommodations/utils/getAmenities.js';
	import { clearSearchFilters } from '@/shared/features/search/utils/clearSearchFilters.js';

	const search = getSearchContext();

	const amenities = $derived(getAmenities());

	const labels = $derived({
		minPrice: m['SearchPage.SearchFiltersPrice.minPrice']({ currency: 'EUR' }),
		maxPrice: m['SearchPage.SearchFiltersPrice.maxPrice']({ currency: 'EUR' }),
		type: m['SearchPage.SearchFiltersType.type'](),
		bedrooms: m['SearchPage.SearchFiltersRoomCount.bedrooms'](),
		beds: m['SearchPage.SearchFiltersRoomCount.beds'](),
		bathrooms: m['SearchPage.SearchFiltersRoomCount.bathrooms'](),
		amenities: m['SearchPage.SearchFiltersAmenities.amenities']()
	});
</script>

{#if search.activeFilters.length}
	<div class="flex w-full flex-wrap gap-2">
		{#each search.activeFilters as key (key)}
			<Button
				size="sm"
				variant="secondary"
				aria-label={m['SearchPage.SearchFiltersSelected.remove']({ filter: labels[key] })}
				onclick={() =>
					search.setCriteria({
						...search.criteria,
						[key]: clearSearchFilters(search.criteria)[key]
					})}
			>
				{labels[key]}: {Array.isArray(search.criteria[key])
					? search.criteria[key]
							.map((value) => amenities.find((item) => item.key === value)?.label ?? value)
							.join(', ')
					: search.criteria[key]}
				<span class="icon-[lucide--x]" aria-hidden="true"></span>
			</Button>
		{/each}

		<Button
			size="sm"
			variant="ghost"
			onclick={() => search.setCriteria(clearSearchFilters(search.criteria))}
		>
			{m['SearchPage.SearchFiltersSelected.clear']()}
		</Button>
	</div>
{/if}
