<script lang="ts">
	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import { Input } from '@/components/ui/input/index.js';
	import NativeDialog from '@/components/ui/native-components/native-dialog/native-dialog.svelte';
	import NativeSelect from '@/components/ui/native-components/native-select/native-select.svelte';

	// HOOKS
	import { getSearchContext } from '@/features/search/context/searchContext.js';

	// CONFIG
	import { ACCOMMODATION_FILTER_DEFS } from '@/features/accommodations/data/accommodationFilterDefs.js';
	import { ACCOMMODATION_TYPES } from '@/shared/features/accommodations/types/accommodationTypes.js';

	// DATA
	import {
		DEFAULT_SEARCH,
		clearSearchFilters,
		type StaySearch
	} from '@/features/search/data/searchCriteria.js';

	// UTILS
	import { m } from '@/lib/paraglide/messages';
	import { getAmenities } from '@/shared/features/accommodations/utils/getAmenities.js';

	const search = getSearchContext();
	const amenities = $derived(getAmenities());

	let draft = $state<StaySearch>(structuredClone(DEFAULT_SEARCH));
	let invalid = $state(false);
	let dialog: NativeDialog;
	const uid = $props.id();

	export function open(): void {
		draft = structuredClone($state.snapshot(search.criteria));
		invalid = false;
		dialog.open();
	}

	function apply(close: () => void): void {
		invalid = Boolean(draft.maxPrice && draft.maxPrice < draft.minPrice);
		if (invalid) return;
		search.setCriteria(draft);
		close();
	}
</script>

<NativeDialog
	bind:this={dialog}
	aria-labelledby={`${uid}-title`}
	class="h-dvh max-h-dvh max-w-2xl rounded-none sm:h-auto sm:max-h-[90dvh] sm:rounded-2xl"
>
	{#snippet children({ close })}
		<form
			onsubmit={(event) => {
				event.preventDefault();
				apply(close);
			}}
		>
			<div class="sticky top-0 flex items-center justify-between border-b bg-popover p-5">
				<h2 id={`${uid}-title`} class="text-xl font-semibold">
					{m['SearchPage.SearchFilters.filters']()}
				</h2>
				<Button variant="ghost" type="button" onclick={close}
					>{m['SearchPage.SearchFilters.close']()}</Button
				>
			</div>
			<div class="flex flex-col gap-8 p-5 sm:p-8">
				<fieldset id={`${uid}-price`} class="scroll-mt-24">
					<legend class="mb-4 font-semibold">{m['SearchPage.SearchFilters.price']()}</legend>
					<input
						type="range"
						min="0"
						max="500"
						step="10"
						value={draft.maxPrice || 500}
						oninput={(event) => {
							draft.maxPrice = Number(event.currentTarget.value);
						}}
						aria-label={search.labels.maxPrice}
						class="mb-5 w-full accent-primary"
					/>
					<div class="grid grid-cols-2 gap-4">
						<div class="flex flex-col gap-2">
							<label class="text-sm" for={`${uid}-min`}>{search.labels.minPrice}</label><Input
								id={`${uid}-min`}
								type="number"
								min="0"
								max="1000000"
								step="0.01"
								required
								bind:value={draft.minPrice}
							/>
						</div>
						<div class="flex flex-col gap-2">
							<label class="text-sm" for={`${uid}-max`}>{search.labels.maxPrice}</label><Input
								id={`${uid}-max`}
								type="number"
								min="0"
								max="1000000"
								step="0.01"
								required
								bind:value={draft.maxPrice}
							/><span class="text-xs text-muted-foreground"
								>0 = {m['SearchPage.SearchFilters.any']()}</span
							>
						</div>
					</div>
				</fieldset>
				<div id={`${uid}-type`} class="flex scroll-mt-24 flex-col gap-3">
					<label class="font-semibold" for={`${uid}-type-select`}>{search.labels.type}</label
					><NativeSelect
						id={`${uid}-type-select`}
						options={ACCOMMODATION_FILTER_DEFS[0].options}
						value={draft.type}
						onchange={(type) => {
							draft.type = ACCOMMODATION_TYPES.find((value) => value === type) ?? '';
						}}
					/>
				</div>
				{#each ['bedrooms', 'beds', 'bathrooms'] as key (key)}
					{@const field = key === 'bedrooms' ? 'bedrooms' : key === 'beds' ? 'beds' : 'bathrooms'}
					<fieldset id={`${uid}-${field}`} class="scroll-mt-24">
						<legend class="mb-3 font-semibold">{search.labels[field]}</legend>
						<div class="flex flex-wrap gap-2">
							{#each [0, 1, 2, 3, 4, 5] as number (number)}<Button
									type="button"
									variant={draft[field] === number ? 'default' : 'outline'}
									aria-pressed={draft[field] === number}
									onclick={() => {
										draft[field] = number;
									}}>{number ? `${number}+` : m['SearchPage.SearchFilters.any']()}</Button
								>{/each}
						</div>
					</fieldset>
				{/each}
				<fieldset id={`${uid}-amenities`} class="scroll-mt-24">
					<legend class="mb-3 font-semibold">{search.labels.amenities}</legend>
					<div class="grid gap-3 sm:grid-cols-2">
						{#each amenities as amenity (amenity.key)}<label
								class="flex min-h-11 items-center gap-3 rounded-lg border px-3 py-2"
								><input
									type="checkbox"
									value={amenity.key}
									bind:group={draft.amenities}
									class="size-4 accent-primary"
								/><span class={`${amenity.icon} size-4 text-muted-foreground`} aria-hidden="true"
								></span>{amenity.label}</label
							>{/each}
					</div>
				</fieldset>
				<fieldset id={`${uid}-rating`} class="scroll-mt-24">
					<legend class="mb-3 font-semibold">{search.labels.rating}</legend>
					<div class="flex gap-2">
						{#each [0, 7, 8, 9] as rating (rating)}<Button
								type="button"
								variant={draft.rating === rating ? 'default' : 'outline'}
								aria-pressed={draft.rating === rating}
								onclick={() => {
									draft.rating = rating;
								}}>{rating ? `${rating}+` : m['SearchPage.SearchFilters.any']()}</Button
							>{/each}
					</div>
				</fieldset>
				<label class="flex min-h-11 items-center gap-3"
					><input
						type="checkbox"
						bind:checked={draft.cancellation}
						class="size-4 accent-primary"
					/>{search.labels.cancellation}</label
				>
				<label class="flex min-h-11 items-center gap-3"
					><input type="checkbox" bind:checked={draft.pets} class="size-4 accent-primary" />{search
						.labels.pets}</label
				>
				{#if invalid}<p role="alert" class="text-sm text-destructive">
						{m['SearchPage.SearchFilters.invalid']()}
					</p>{/if}
			</div>
			<div class="sticky bottom-0 flex items-center justify-between gap-4 border-t bg-popover p-5">
				<Button
					type="button"
					variant="ghost"
					onclick={() => {
						draft = clearSearchFilters(draft);
					}}>{m['SearchPage.SearchFilters.clear']()}</Button
				><Button type="submit">{m['SearchPage.SearchFilters.show']()}</Button>
			</div>
		</form>
	{/snippet}
</NativeDialog>
