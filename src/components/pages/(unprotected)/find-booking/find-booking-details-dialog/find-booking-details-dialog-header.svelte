<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import BookingStatusBadge from '@/features/bookings/components/booking-status-badge/booking-status-badge.svelte';

	// TYPES
	import type { Booking } from '@/shared/features/bookings/types/bookingTypes.js';

	let { booking, titleId }: { booking: Booking; titleId: string } = $props();
</script>

<header class="flex min-w-0 flex-col items-start gap-2">
	<h2 id={titleId} class="text-xl font-semibold tracking-tight">
		{m['FindBookingPage.FindBookingDetailsDialogHeader.title']()}
	</h2>

	<p class="text-base font-medium wrap-anywhere">{booking.accommodationName}</p>

	<BookingStatusBadge status={booking.status} />
</header>
