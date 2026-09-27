<script lang="ts">
	// COMPONENTS
	import GoogleMap from '@/components/ui/custom-components/google-components/google-map/google-map.svelte';
	import { Button } from '@/components/ui/button/index.js';

	// UTILS
	import { m } from '@/lib/paraglide/messages';

	// TYPES
	import type { PublicAccommodation } from '@/shared/features/accommodations/types/accommodationTypes.js';

	let { accommodation }: { accommodation: PublicAccommodation } = $props();

	const mapsUrl = $derived(
		`https://www.google.com/maps/search/?api=1&query=${accommodation.latitude},${accommodation.longitude}`
	);
</script>

<section id="location" class="scroll-mt-24 py-9" aria-labelledby="location-title">
	<h2 id="location-title" class="text-2xl font-semibold tracking-tight">
		{m['AccommodationPage.AccommodationDetailsLocation.location']()}
	</h2>
	<p class="mt-3 mb-5 text-sm text-muted-foreground">
		{accommodation.address.street}
		{accommodation.address.streetNumber}, {accommodation.address.city}, {accommodation.address
			.country}
	</p>

	<GoogleMap
		position={{ lat: accommodation.latitude, lng: accommodation.longitude }}
		disabled
		label={m['AccommodationPage.AccommodationDetailsLocation.location']()}
		pinTitle={accommodation.name}
		loadingText={m['AccommodationPage.AccommodationDetailsLocation.mapLoading']()}
		errorText={m['AccommodationPage.AccommodationDetailsLocation.mapError']()}
	/>

	<Button href={mapsUrl} target="_blank" rel="noopener noreferrer" variant="outline" class="mt-4">
		{m['AccommodationPage.AccommodationDetailsLocation.openMap']()}
		<span class="icon-[lucide--arrow-up-right]" data-icon="inline-end" aria-hidden="true"></span>
	</Button>
</section>
