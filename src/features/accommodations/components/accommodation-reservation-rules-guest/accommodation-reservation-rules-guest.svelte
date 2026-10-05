<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// TYPES
	import type { PublicAccommodation } from '@/shared/features/accommodations/types/accommodationTypes.js';

	let { accommodation }: { accommodation: PublicAccommodation } = $props();
</script>

<section class="rounded-xl border p-4 text-sm leading-6">
	<h3 class="font-semibold">{m['AccommodationsFeature.ReservationRulesGuest.title']()}</h3>
	
	<div class="mt-3 flex flex-col gap-3 text-muted-foreground">
		<p>{m['AccommodationsFeature.ReservationRulesGuest.overnightRequired']()}</p>

		<p>
			{accommodation.sameDayReservation
				? m['AccommodationsFeature.ReservationRulesGuest.sameDayOn']({
						time: accommodation.checkInStart
					})
				: m['AccommodationsFeature.ReservationRulesGuest.sameDayOff']()}
		</p>

		<p>
			{m['AccommodationsFeature.ReservationRulesGuest.conditions']({
				timeZone: accommodation.timeZone,
				guests: accommodation.maxGuests,
				minimum: accommodation.minimumStay
			})}
		</p>

		{#if accommodation.bookingMode !== 'instant'}
			<p>{m['AccommodationsFeature.ReservationRulesGuest.approval']()}</p>
		{/if}
	</div>
</section>
