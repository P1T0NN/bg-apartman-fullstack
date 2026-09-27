<script lang="ts">
	// COMPONENTS
	import AccommodationDetailsOverview from './accommodation-details-overview.svelte';
	import AccommodationDetailsAmenities from './accommodation-details-amenities.svelte';
	import AccommodationDetailsLocation from './accommodation-details-location.svelte';
	import AccommodationDetailsRules from './accommodation-details-rules.svelte';

	// TYPES
	import type { PublicAccommodation } from '@/shared/features/accommodations/types/accommodationTypes.js';

	let { accommodation }: { accommodation: PublicAccommodation } = $props();
</script>

<div class="min-w-0 divide-y divide-border wrap-anywhere">
	<AccommodationDetailsOverview {accommodation} />
	<AccommodationDetailsAmenities {accommodation} />
	<AccommodationDetailsLocation {accommodation} />
	<AccommodationDetailsRules {accommodation} />
</div>
