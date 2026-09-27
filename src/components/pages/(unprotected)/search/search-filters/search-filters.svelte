<script lang="ts">
	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import NativeSelect from '@/components/ui/native-components/native-select/native-select.svelte';
	import { Separator } from '@/components/ui/separator/index.js';
	import SearchFiltersButton from './search-filters-button.svelte';
	import SearchFiltersDialog from './search-filters-dialog.svelte';
	import SearchFiltersPopular from './search-filters-popular.svelte';
	import SearchFiltersSelected from './search-filters-selected.svelte';

	// HOOKS
	import { getSearchContext } from '@/features/search/context/searchContext.js';

	// UTILS
	import { m } from '@/lib/paraglide/messages';

	const search = getSearchContext();
	let dialog: SearchFiltersDialog;
</script>

<div class="flex flex-wrap items-center gap-2 pt-4">
	<div class="min-[68.75rem]:hidden">
		<NativeSelect
			label={m['SearchPage.SearchFilters.sort']()}
			options={search.sorts}
			value={search.criteria.sort}
			onchange={(value) => search.setCriteria({ ...search.criteria, sort: value })}
			includePlaceholderOption={false}
		/>
	</div>
	<SearchFiltersButton onopen={() => dialog.open()} />
	<Separator orientation="vertical" class="hidden h-5! sm:block" />
	<SearchFiltersPopular />
	{#if search.hasLocation}
		<Button
			variant="outline"
			class="ms-auto min-[68.75rem]:hidden"
			aria-pressed={search.showMap}
			onclick={search.toggleMap}
			><span
				class={search.showMap ? 'icon-[lucide--list]' : 'icon-[lucide--map]'}
				aria-hidden="true"
			></span>{search.showMap ? m['SearchPage.list']() : m['SearchPage.map']()}</Button
		>
	{/if}
</div>

<SearchFiltersSelected />
<SearchFiltersDialog bind:this={dialog} />
