<script lang="ts">
	// COMPONENTS
	import SearchFiltersAmenities from './search-filters-amenities.svelte';
	import SearchFiltersRoomCount from './search-filters-room-count.svelte';
	import SearchFiltersPrice from './search-filters-price.svelte';
	import SearchFiltersType from './search-filters-type.svelte';
	import SearchFiltersClearButton from './search-filters-clear-button.svelte';
	import SearchFiltersApplyButton from './search-filters-apply-button.svelte';
	import { Button } from '@/components/ui/button/index.js';
	import NativeDialog from '@/components/ui/native-components/native-dialog/native-dialog.svelte';

	// HOOKS
	import { getSearchContext } from '@/features/search/context/searchContext.js';

	// DATA
	import { DEFAULT_SEARCH } from '@/features/search/data/searchCriteria.js';

	// UTILS
	import { m } from '@/lib/paraglide/messages';

	// TYPES
	import type { StaySearch } from '@/shared/features/search/types/searchTypes.js';

	const uid = $props.id();

	const search = getSearchContext();

	let draft = $state<StaySearch>($state.snapshot(DEFAULT_SEARCH));
	let invalid = $state(false);
</script>

<NativeDialog
	aria-labelledby={`${uid}-title`}
	class="h-dvh max-h-dvh max-w-2xl rounded-none sm:h-auto sm:max-h-[90dvh] sm:rounded-2xl"
	onbeforetoggle={(event) => {
		if (event.newState === 'open') {
			draft = $state.snapshot(search.criteria);
			invalid = false;
		}
	}}
>
	{#snippet trigger({ id })}
		<Button
			type="button"
			variant={search.activeFilters.length ? 'secondary' : 'outline'}
			commandfor={id}
			command="show-modal"
		>
			<span class="icon-[lucide--sliders-horizontal]" aria-hidden="true"></span>
			{m['SearchPage.SearchFilters.filters']()}{search.activeFilters.length
				? ` (${search.activeFilters.length})`
				: ''}
		</Button>
	{/snippet}

	{#snippet children({ id, close })}
		<div class="sticky top-0 flex items-center justify-between border-b bg-popover p-5">
			<h2 id={`${uid}-title`} class="text-xl font-semibold">
				{m['SearchPage.SearchFilters.filters']()}
			</h2>

			<Button variant="ghost" type="button" commandfor={id} command="close">
				{m['SearchPage.SearchFilters.close']()}
			</Button>
		</div>

		<form onsubmit={(event) => event.preventDefault()}>
			<div class="flex flex-col gap-8 p-5 sm:p-8">
				<SearchFiltersPrice bind:minPrice={draft.minPrice} bind:maxPrice={draft.maxPrice} />

				<SearchFiltersType bind:value={draft.type} />

				{#each ['bedrooms', 'beds', 'bathrooms'] as key (key)}
					{@const field = key === 'bedrooms' ? 'bedrooms' : key === 'beds' ? 'beds' : 'bathrooms'}
					<SearchFiltersRoomCount {field} bind:value={draft[field]} />
				{/each}

				<SearchFiltersAmenities bind:selected={draft.amenities} />

				{#if invalid}
					<p role="alert" class="text-sm text-destructive">
						{m['SearchPage.SearchFiltersApplyButton.invalid']()}
					</p>
				{/if}
			</div>

			<div class="sticky bottom-0 flex items-center justify-between gap-4 border-t bg-popover p-5">
				<SearchFiltersClearButton bind:draft />

				<SearchFiltersApplyButton {draft} {close} bind:invalid />
			</div>
		</form>
	{/snippet}
</NativeDialog>
