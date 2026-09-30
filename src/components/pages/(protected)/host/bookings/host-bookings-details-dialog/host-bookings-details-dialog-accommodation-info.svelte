<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import AccommodationLocation from '@/features/accommodations/components/accommodation-location/accommodation-location.svelte';

	// TYPES
	import type { BookingAccommodation } from '@/shared/features/bookings/types/bookingHostTypes.js';

	let { accommodation }: { accommodation: BookingAccommodation | null } = $props();
</script>

<div class="flex min-w-0 flex-col gap-2 rounded-2xl border p-3 sm:col-span-2">
	<dt class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
		{m['HostBookingsPage.HostBookingsDetailsDialogAccommodationInfo.accommodation']()}
	</dt>
	<dd>
		{#if accommodation}
			<div class="flex min-w-0 items-center gap-3">
				<div class="size-10 shrink-0 overflow-hidden rounded-xl bg-muted">
					{#if accommodation.imageUrl}
						<img
							src={accommodation.imageUrl}
							alt=""
							loading="lazy"
							decoding="async"
							class="size-full object-cover"
						/>
					{:else}
						<span
							class="flex size-full items-center justify-center text-muted-foreground"
							aria-hidden="true"
						>
							<span class="icon-[lucide--image-off] size-4"></span>
						</span>
					{/if}
				</div>
				<div class="min-w-0">
					<p class="truncate font-medium">{accommodation.name}</p>
					<AccommodationLocation
						city={accommodation.city}
						country={accommodation.country}
						class="block truncate text-sm text-muted-foreground"
					/>
				</div>
			</div>
		{:else}
			<p class="text-sm text-muted-foreground">
				{m['HostBookingsPage.HostBookingsDetailsDialogAccommodationInfo.unavailable']()}
			</p>
		{/if}
	</dd>
</div>
