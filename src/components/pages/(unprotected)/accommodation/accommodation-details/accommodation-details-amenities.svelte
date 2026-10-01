<script lang="ts">
	// COMPONENTS
	import AccommodationDetailsAmenityItem from './accommodation-details-amenity-item.svelte';

	// UTILS
	import { m } from '@/lib/paraglide/messages';
	import { getAmenities } from '@/shared/features/accommodations/utils/getAmenities.js';

	// TYPES
	import type { PublicAccommodation } from '@/shared/features/accommodations/types/accommodationTypes.js';

	let { accommodation }: { accommodation: PublicAccommodation } = $props();

	const amenities = $derived(
		getAmenities().filter((item) => accommodation.amenities.includes(item.key))
	);
</script>

<section id="amenities" class="scroll-mt-24 py-9" aria-labelledby="amenities-title">
	<h2 id="amenities-title" class="mb-5 text-2xl font-semibold tracking-tight">
		{m['AccommodationPage.AccommodationDetailsAmenities.amenities']()}
	</h2>

	{#if amenities.length}
		<ul class="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
			{#each amenities.slice(0, 6) as amenity (amenity.key)}
				<AccommodationDetailsAmenityItem label={amenity.label} icon={amenity.icon} />
			{/each}
		</ul>

		{#if amenities.length > 6}
			<details class="mt-4">
				<summary
					class="w-fit cursor-pointer rounded-lg border px-4 py-3 text-sm font-medium hover:bg-accent"
				>
					{m['AccommodationPage.AccommodationDetailsAmenities.moreAmenities']({
						count: amenities.length - 6
					})}
				</summary>
				<ul class="mt-4 grid grid-cols-1 gap-x-6 sm:grid-cols-2">
					{#each amenities.slice(6) as amenity (amenity.key)}
						<AccommodationDetailsAmenityItem label={amenity.label} icon={amenity.icon} />
					{/each}
				</ul>
			</details>
		{/if}
	{:else}
		<p class="text-sm text-muted-foreground">
			{m['AccommodationPage.AccommodationDetailsAmenities.noAmenities']()}
		</p>
	{/if}
</section>
