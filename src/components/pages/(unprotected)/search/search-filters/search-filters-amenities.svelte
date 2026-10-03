<script lang="ts">
	// COMPONENTS
	import AccommodationAmenityItem from '@/features/accommodations/components/accommodation-amenities/accommodation-amenities-item.svelte';
	import AccommodationAmenitiesDialog from '@/features/accommodations/components/accommodation-amenities/accommodation-amenities-dialog/accommodation-amenities-dialog.svelte';

	// CONFIG
	import { POPULAR_AMENITY_KEYS } from '@/shared/features/accommodations/data/accommodationsData.js';

	// UTILS
	import { m } from '@/lib/paraglide/messages';
	import { getAmenities } from '@/shared/features/accommodations/utils/getAmenities.js';

	// TYPES
	import type { AmenityKey } from '@/shared/features/accommodations/types/amenityTypes.js';

	let { selected = $bindable() }: { selected: AmenityKey[] } = $props();

	const uid = $props.id();

	const amenities = $derived(getAmenities());

	const popular = $derived(
		amenities.filter((item) => POPULAR_AMENITY_KEYS.some((key) => key === item.key))
	);

	const additionalCount = $derived(
		selected.filter((key) => !popular.some((item) => item.key === key)).length
	);
</script>

<fieldset id={`${uid}-amenities`} class="scroll-mt-24">
	<legend class="mb-3 font-semibold">{m['SearchPage.SearchFiltersAmenities.amenities']()}</legend>

	<p class="mb-3 text-sm text-muted-foreground">
		{m['SearchPage.SearchFiltersAmenities.popularAmenities']()}
	</p>

	<div class="grid gap-1 sm:grid-cols-2">
		{#each popular as amenity (amenity.key)}
			<AccommodationAmenityItem
				label={amenity.label}
				icon={amenity.icon}
				checked={selected.includes(amenity.key)}
				disabled={false}
				onChange={(checked) => {
					selected = checked
						? [...selected, amenity.key]
						: selected.filter((key) => key !== amenity.key);
				}}
			/>
		{/each}
	</div>

	<div class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
		<!-- Keep the editor inside the parent dialog so native modal stacking and focus restoration apply. -->
		<AccommodationAmenitiesDialog
			{selected}
			{additionalCount}
			triggerLabel={m['SearchPage.SearchFiltersAmenities.allAmenities']()}
			onSave={(values) => {
				selected = [...values];
			}}
		/>

		{#if additionalCount}
			<span class="text-sm text-muted-foreground" role="status">
				{m['SearchPage.SearchFiltersAmenities.additionalAmenities']({ count: additionalCount })}
			</span>
		{/if}
	</div>
</fieldset>
