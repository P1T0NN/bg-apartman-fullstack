<script lang="ts">
	// COMPONENTS
	import AccommodationDetailsAmenityItem from './accommodation-details-amenity-item.svelte';
	import { Button } from '@/components/ui/button/index.js';

	// UTILS
	import { m } from '@/lib/paraglide/messages';
	import { getAmenities } from '@/shared/features/accommodations/utils/getAmenities.js';

	// TYPES
	import type { PublicAccommodation } from '@/shared/features/accommodations/types/accommodationTypes.js';

	let { accommodation }: { accommodation: PublicAccommodation } = $props();

	const COLLAPSED_COUNT = 8;

	const amenities = $derived(
		getAmenities().filter((item) => accommodation.amenities.includes(item.key))
	);

	let isExpanded = $state(false);
	const visibleAmenities = $derived(isExpanded ? amenities : amenities.slice(0, COLLAPSED_COUNT));
</script>

<section id="amenities" class="scroll-mt-32 py-9" aria-labelledby="amenities-title">
	<h2 id="amenities-title" class="mb-6 text-2xl font-semibold tracking-tight">
		{m['AccommodationPage.AccommodationDetailsAmenities.amenities']()}
	</h2>

	{#if amenities.length}
		<ul class="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
			{#each visibleAmenities as amenity (amenity.key)}
				<AccommodationDetailsAmenityItem label={amenity.label} icon={amenity.icon} />
			{/each}
		</ul>

		{#if amenities.length > COLLAPSED_COUNT}
			<Button
				variant="outline"
				class="mt-6"
				aria-expanded={isExpanded}
				onclick={() => (isExpanded = !isExpanded)}
			>
				{isExpanded
					? m['AccommodationPage.AccommodationDetailsAmenities.showLess']()
					: m['AccommodationPage.AccommodationDetailsAmenities.moreAmenities']({
							count: amenities.length - COLLAPSED_COUNT
						})}
			</Button>
		{/if}
	{:else}
		<p class="text-sm text-muted-foreground">
			{m['AccommodationPage.AccommodationDetailsAmenities.noAmenities']()}
		</p>
	{/if}
</section>
