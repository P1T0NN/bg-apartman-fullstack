<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime';

	// COMPONENTS
	import Plural from '@/components/ui/custom-components/plural/plural.svelte';

	// UTILS
	import { getBookingNights } from '@/shared/features/bookings/utils/getBookingNights.js';

	let {
		checkInDate,
		checkOutDate,
		adults,
		children
	}: { checkInDate: string; checkOutDate: string; adults: number; children: number } = $props();

	const nights = $derived(getBookingNights(checkInDate, checkOutDate));
	const guests = $derived(adults + children);
</script>

<div class="min-w-0 rounded-2xl border p-3">
	<dt class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
		{m['HostBookingsPage.HostBookingsDetailsDialogGuests.trip']()}
	</dt>
	<dd class="mt-1.5 flex flex-col gap-1 text-sm">
		<span class="font-medium">
			<Plural
				count={nights}
				forms={{
					one: m['HostBookingsPage.HostBookingsDetailsDialogGuests.night'](),
					other: m['HostBookingsPage.HostBookingsDetailsDialogGuests.nights']()
				}}
				locale={getLocale()}
			/>
			<span class="mx-0.5" aria-hidden="true">·</span>
			<Plural
				count={guests}
				forms={{
					one: m['HostBookingsPage.HostBookingsDetailsDialogGuests.guest'](),
					other: m['HostBookingsPage.HostBookingsDetailsDialogGuests.guests']()
				}}
				locale={getLocale()}
			/>
		</span>
		<span class="text-muted-foreground">
			{m['HostBookingsPage.HostBookingsDetailsDialogGuests.guestBreakdown']({
				adults,
				children
			})}
		</span>
	</dd>
</div>
