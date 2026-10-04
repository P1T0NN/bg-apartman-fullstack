<script lang="ts">
	import { m } from '@/lib/paraglide/messages';
	import type { BookingStatus } from '@/shared/features/bookings/schemas/bookingSchemas.js';
	let { status }: { status: BookingStatus } = $props();
</script>

<header class="flex flex-col items-start gap-5 pb-9 sm:flex-row sm:items-center sm:gap-6 sm:pb-12">
	<div
		class="flex size-16 shrink-0 items-center justify-center rounded-full bg-success/10 text-success"
		aria-hidden="true"
	>
		<span class="icon-[lucide--check] size-8"></span>
	</div>
	<div>
		<p class="mb-2 text-sm font-medium text-muted-foreground">
			{m['BookingPage.BookingConfirmation.eyebrow']()}
		</p>
		<h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">
			{status === 'expired'
				? m['BookingsFeature.status.expired']()
				: m['BookingPage.BookingCheckout.booked']()}
		</h1>
		<p class="mt-3 max-w-prose text-sm leading-6 text-muted-foreground">
			{status === 'expired'
				? m['BookingsFeature.status.expiredHint']()
				: m['BookingPage.BookingConfirmation.bookedHint']()}
		</p>
	</div>
</header>
