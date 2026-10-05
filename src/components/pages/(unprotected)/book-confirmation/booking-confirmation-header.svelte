<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// TYPES
	import type { BookingStatus } from '@/shared/features/bookings/types/bookingTypes.js';

	let { status }: { status: BookingStatus } = $props();

	const accepted = $derived(status === 'confirmed' || status === 'completed');
</script>

<header class="flex flex-col items-start gap-5 pb-9 sm:flex-row sm:items-center sm:gap-6 sm:pb-12">
	<div
		class={[
			'flex size-16 shrink-0 items-center justify-center rounded-full',
			accepted ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
		]}
		aria-hidden="true"
	>
		<span
			class={[
				accepted
					? 'icon-[lucide--check]'
					: status === 'pending'
						? 'icon-[lucide--clock]'
						: 'icon-[lucide--circle-minus]',
				'size-8'
			]}
		></span>
	</div>
	<div>
		<p class="mb-2 text-sm font-medium text-muted-foreground">
			{m['BookingPage.BookingConfirmation.eyebrow']()}
		</p>
		<h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">
			{status === 'pending'
				? m['BookingPage.BookingCheckout.booked']()
				: m[`BookingsFeature.status.${status}`]()}
		</h1>
		<p class="mt-3 max-w-prose text-sm leading-6 text-muted-foreground">
			{status === 'pending'
				? m['BookingPage.BookingConfirmation.bookedHint']()
				: m[`BookingsFeature.status.${status}Hint`]()}
		</p>
	</div>
</header>
