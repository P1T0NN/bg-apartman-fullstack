<script lang="ts">
	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// HOOKS
	import { getSearchContext } from '@/features/search/context/searchContext.js';

	// DATA
	import { clearSearchFilters } from '@/features/search/data/searchCriteria.js';

	// UTILS
	import { m } from '@/lib/paraglide/messages';
	import { getAmenities } from '@/shared/features/accommodations/utils/getAmenities.js';

	const search = getSearchContext();
	const amenities = $derived(getAmenities());
</script>

{#if search.activeFilters.length}
	<div class="flex flex-wrap gap-2 pt-3">
		{#each search.activeFilters as key (key)}
			<Button
				size="sm"
				variant="secondary"
				aria-label={m['SearchPage.SearchFilters.remove']({ filter: search.labels[key] })}
				onclick={() =>
					search.setCriteria({
						...search.criteria,
						[key]: clearSearchFilters(search.criteria)[key]
					})}
			>
				{search.labels[key]}{key !== 'pets' && key !== 'cancellation'
					? `: ${Array.isArray(search.criteria[key]) ? search.criteria[key].map((value) => amenities.find((item) => item.key === value)?.label ?? value).join(', ') : search.criteria[key]}`
					: ''}<span class="icon-[lucide--x]" aria-hidden="true"></span>
			</Button>
		{/each}
		<Button
			size="sm"
			variant="ghost"
			onclick={() => search.setCriteria(clearSearchFilters(search.criteria))}
			>{m['SearchPage.SearchFilters.clear']()}</Button
		>
	</div>
{/if}
