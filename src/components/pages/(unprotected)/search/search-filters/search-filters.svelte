<script lang="ts">
	// LIBRARIES
	import { Slider } from 'bits-ui';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import { Input } from '@/components/ui/input/index.js';
	import NativeDialog from '@/components/ui/native-components/native-dialog/native-dialog.svelte';
	import NativeSelect from '@/components/ui/native-components/native-select/native-select.svelte';
	import AccommodationAmenityItem from '@/features/accommodations/components/accommodation-amenities/accommodation-amenities-item.svelte';
	import AccommodationAmenitiesDialog from '@/features/accommodations/components/accommodation-amenities/accommodation-amenities-dialog/accommodation-amenities-dialog.svelte';

	// HOOKS
	import { getSearchContext } from '@/features/search/context/searchContext.js';

	// CONFIG
	import { ACCOMMODATION_FILTER_DEFS } from '@/features/accommodations/data/accommodationFilterDefs.js';
	import { ACCOMMODATION_TYPES } from '@/shared/features/accommodations/types/accommodationTypes.js';
	import { POPULAR_AMENITY_KEYS } from '@/shared/features/accommodations/data/accommodationsData.js';

	// DATA
	import {
		DEFAULT_SEARCH,
		clearSearchFilters,
		type StaySearch
	} from '@/features/search/data/searchCriteria.js';

	// UTILS
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime';
	import { formatCurrency } from '@/shared/utils/currency.js';
	import { getAmenities } from '@/shared/features/accommodations/utils/getAmenities.js';

	const search = getSearchContext();
	const amenities = $derived(getAmenities());
	const popular = $derived(
		amenities.filter((item) => POPULAR_AMENITY_KEYS.some((key) => key === item.key))
	);

	let draft = $state<StaySearch>(structuredClone(DEFAULT_SEARCH));
	const priceSliderMaximum = $derived(
		Math.max(500, Math.ceil(Math.max(draft.minPrice || 0, draft.maxPrice || 0) / 500) * 500)
	);
	const priceSliderStep = $derived(Math.max(1, Math.round(priceSliderMaximum / 500)));
	const priceSliderEnd = $derived(priceSliderMaximum + priceSliderStep);
	const minimumPriceLabel = $derived(
		formatCurrency(Math.round((draft.minPrice || 0) * 100), getLocale())
	);
	const maximumPriceLabel = $derived(
		draft.maxPrice
			? formatCurrency(Math.round(draft.maxPrice * 100), getLocale())
			: m['SearchPage.SearchFilters.noMaximum']()
	);
	const additionalCount = $derived(
		draft.amenities.filter((key) => !popular.some((item) => item.key === key)).length
	);
	let invalid = $state(false);
	let minPriceInput = $state<HTMLInputElement | null>(null);
	let maxPriceInput = $state<HTMLInputElement | null>(null);
	const uid = $props.id();

	function apply(close: () => void): void {
		if (!minPriceInput?.reportValidity() || !maxPriceInput?.reportValidity()) return;
		invalid = Boolean(draft.maxPrice && draft.maxPrice < draft.minPrice);
		if (invalid) return;
		search.setCriteria(draft);
		close();
	}
</script>

<NativeDialog
	aria-labelledby={`${uid}-title`}
	class="h-dvh max-h-dvh max-w-2xl rounded-none sm:h-auto sm:max-h-[90dvh] sm:rounded-2xl"
	onbeforetoggle={(event) => {
		if (event.newState === 'open') {
			draft = structuredClone($state.snapshot(search.criteria));
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
		<div class="flex flex-col gap-8 p-5 sm:p-8">
			<fieldset id={`${uid}-price`} class="scroll-mt-24">
				<legend class="mb-4 font-semibold">{m['SearchPage.SearchFilters.price']()}</legend>
				<output
					id={`${uid}-price-values`}
					for={`${uid}-price-slider ${uid}-min ${uid}-max`}
					class="mb-3 flex items-center justify-between gap-4 text-sm font-medium tabular-nums"
				>
					<span>{minimumPriceLabel}</span>
					<span>{maximumPriceLabel}</span>
				</output>
				<Slider.Root
					id={`${uid}-price-slider`}
					type="multiple"
					min={0}
					max={priceSliderEnd}
					step={priceSliderStep}
					autoSort={false}
					value={[draft.minPrice || 0, draft.maxPrice || priceSliderEnd]}
					onValueChange={(values) => {
						draft.minPrice = Math.min(values[0], priceSliderMaximum);
						draft.maxPrice = values[1] === priceSliderEnd ? 0 : values[1];
					}}
					class="relative mb-5 flex h-11 w-full touch-none items-center select-none"
				>
					<span class="absolute h-2 w-full rounded-full bg-muted" aria-hidden="true"></span>
					<Slider.Range class="absolute h-2 rounded-full bg-primary" />
					<Slider.Thumb
						index={0}
						aria-label={search.labels.minPrice}
						aria-valuetext={minimumPriceLabel}
						class="block size-5 rounded-full border-2 border-primary bg-background shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
					/>
					<Slider.Thumb
						index={1}
						aria-label={search.labels.maxPrice}
						aria-valuetext={maximumPriceLabel}
						class="block size-5 rounded-full border-2 border-primary bg-background shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
					/>
				</Slider.Root>
				<div class="grid grid-cols-2 gap-4">
					<div class="flex flex-col gap-2">
						<label class="text-sm" for={`${uid}-min`}>{search.labels.minPrice}</label>
						<Input
							id={`${uid}-min`}
							bind:ref={minPriceInput}
							type="number"
							min="0"
							max="1000000"
							step="0.01"
							required
							bind:value={draft.minPrice}
						/>
					</div>
					<div class="flex flex-col gap-2">
						<label class="text-sm" for={`${uid}-max`}>{search.labels.maxPrice}</label>
						<Input
							id={`${uid}-max`}
							bind:ref={maxPriceInput}
							type="number"
							min="0"
							max="1000000"
							step="0.01"
							placeholder={m['SearchPage.SearchFilters.noMaximum']()}
							bind:value={
								() => draft.maxPrice || undefined,
								(value) => {
									draft.maxPrice = value ?? 0;
								}
							}
						/>
					</div>
				</div>
			</fieldset>
			<div id={`${uid}-type`} class="flex scroll-mt-24 flex-col gap-3">
				<label class="font-semibold" for={`${uid}-type-select`}>{search.labels.type}</label>
				<NativeSelect
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
						{#each [0, 1, 2, 3, 4, 5] as number (number)}
							<Button
								type="button"
								variant={draft[field] === number ? 'default' : 'outline'}
								aria-pressed={draft[field] === number}
								onclick={() => {
									draft[field] = number;
								}}
							>
								{number ? `${number}+` : m['SearchPage.SearchFilters.any']()}
							</Button>
						{/each}
					</div>
				</fieldset>
			{/each}
			<fieldset id={`${uid}-amenities`} class="scroll-mt-24">
				<legend class="mb-3 font-semibold">{search.labels.amenities}</legend>
				<p class="mb-3 text-sm text-muted-foreground">
					{m['SearchPage.SearchFilters.popularAmenities']()}
				</p>
				<div class="grid gap-1 sm:grid-cols-2">
					{#each popular as amenity (amenity.key)}
						<AccommodationAmenityItem
							label={amenity.label}
							icon={amenity.icon}
							checked={draft.amenities.includes(amenity.key)}
							disabled={false}
							onChange={(checked) => {
								draft.amenities = checked
									? [...draft.amenities, amenity.key]
									: draft.amenities.filter((key) => key !== amenity.key);
							}}
						/>
					{/each}
				</div>
				<div class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
					<!-- Keep the editor inside the parent dialog so native modal stacking and focus restoration apply. -->
					<AccommodationAmenitiesDialog
						selected={draft.amenities}
						{additionalCount}
						triggerLabel={m['SearchPage.SearchFilters.allAmenities']()}
						onSave={(selected) => {
							draft.amenities = [...selected];
						}}
					/>
					{#if additionalCount}
						<span class="text-sm text-muted-foreground" role="status">
							{m['SearchPage.SearchFilters.additionalAmenities']({ count: additionalCount })}
						</span>
					{/if}
				</div>
			</fieldset>
			{#if invalid}
				<p role="alert" class="text-sm text-destructive">
					{m['SearchPage.SearchFilters.invalid']()}
				</p>
			{/if}
		</div>
		<div class="sticky bottom-0 flex items-center justify-between gap-4 border-t bg-popover p-5">
			<Button
				type="button"
				variant="ghost"
				onclick={() => {
					draft = clearSearchFilters(draft);
				}}
			>
				{m['SearchPage.SearchFilters.clear']()}
			</Button><Button type="button" onclick={() => apply(close)}>
				{m['SearchPage.SearchFilters.show']()}
			</Button>
		</div>
	{/snippet}
</NativeDialog>
