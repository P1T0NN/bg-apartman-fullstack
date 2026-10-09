<script lang="ts">
	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import SearchToolbarSortSelect from './search-toolbar-sort-select.svelte';

	// HOOKS
	import { getSearchContext } from '@/features/search/context/searchContext.js';

	// UTILS
	import { m } from '@/lib/paraglide/messages';

	const search = getSearchContext();
</script>

<div class="flex flex-wrap items-center gap-2">
	<div class="min-[68.75rem]:hidden">
		<SearchToolbarSortSelect />
	</div>

	{#if search.hasLocation}
		<Button
			variant="outline"
			class="ms-auto min-[68.75rem]:hidden"
			aria-pressed={search.showMap}
			onclick={search.toggleMap}
		>
			<span
				class={search.showMap ? 'icon-[lucide--list]' : 'icon-[lucide--map]'}
				aria-hidden="true"
			></span>

			{search.showMap ? m['SearchPage.SearchToolbar.list']() : m['SearchPage.SearchToolbar.map']()}
		</Button>
	{/if}
</div>
