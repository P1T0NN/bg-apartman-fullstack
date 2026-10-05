<script lang="ts">
	// COMPONENTS
	import BookingCancellationPolicy from '@/features/bookings/components/booking-cancellation-policy/booking-cancellation-policy.svelte';

	// TYPES
	import type { PublicAccommodation } from '@/shared/features/accommodations/types/accommodationTypes.js';

	let { accommodation }: { accommodation: PublicAccommodation } = $props();
</script>

<div id="cancellation-policy" class="scroll-mt-24 py-9">
	<BookingCancellationPolicy
		policy={accommodation.cancellationPolicy}
		timeZone={accommodation.timeZone}
		timeline
		staticPolicy
	/>
</div>
