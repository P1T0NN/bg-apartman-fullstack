<script lang="ts">
	// SVELTEKIT IMPORTS
	import { page } from '$app/state';

	// COMPONENTS
	import AccommodationGuestCancellationPolicy from '@/features/accommodations/components/accommodation-guest-cancellation-policy/accommodation-guest-cancellation-policy.svelte';

	// TYPES
	import type { PublicAccommodation } from '@/shared/features/accommodations/types/accommodationTypes.js';

	let { accommodation }: { accommodation: PublicAccommodation } = $props();
</script>

<div id="cancellation-policy" class="scroll-mt-24 py-9">
	<AccommodationGuestCancellationPolicy
		{accommodation}
		timeline
		checkInDate={page.url.searchParams.get('checkIn') ?? ''}
	/>
</div>
