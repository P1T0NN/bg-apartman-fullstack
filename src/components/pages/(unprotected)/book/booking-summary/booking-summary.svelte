<script lang="ts">
	// COMPONENTS
	import * as Card from '@/components/ui/card/index.js';
	import Price from '@/components/ui/custom-components/price/price.svelte';

	// UTILS
	import { m } from '@/lib/paraglide/messages';
	import { DAY_IN_MS, parseIsoDate } from '@/shared/utils/date.js';

	// TYPES
	import type { PublicAccommodation } from '@/shared/features/accommodations/types/accommodationTypes.js';

	let {
		accommodation,
		checkInDate,
		checkOutDate,
		guests
	}: {
		accommodation: PublicAccommodation;
		checkInDate: string;
		checkOutDate: string;
		guests: number;
	} = $props();

	const nights = $derived.by(() => {
		const start = parseIsoDate(checkInDate);
		const end = parseIsoDate(checkOutDate);
		if (!start || !end) return 0;
		return (Date.parse(end.toString()) - Date.parse(start.toString())) / DAY_IN_MS;
	});
	const subtotalMinor = $derived(nights * accommodation.pricePerNightMinor);
</script>

<aside aria-labelledby="booking-summary-title" class="min-w-0 lg:sticky lg:top-24">
	<Card.Root class="rounded-2xl shadow-sm">
		<Card.Header>
			<Card.Title
				><h2 id="booking-summary-title">{m['BookingPage.BookingSummary.title']()}</h2></Card.Title
			>
		</Card.Header>

		<Card.Content class="flex flex-col gap-6">
			<div class="flex items-center gap-4">
				{#if accommodation.imageUrls[0]}<img
						src={accommodation.imageUrls[0]}
						alt=""
						class="size-20 shrink-0 rounded-xl object-cover"
					/>
				{/if}

				<div class="min-w-0">
					<p class="font-semibold [overflow-wrap:anywhere]">{accommodation.name}</p>
					<p class="mt-1 text-sm text-muted-foreground">
						{accommodation.address.city}, {accommodation.address.country}
					</p>
				</div>
			</div>

			<div class="border-t pt-5">
				<dl class="flex flex-col gap-3 text-sm">
					<div class="flex flex-wrap justify-between gap-2">
						<dt class="text-muted-foreground">{m['BookingPage.BookingSummary.nightlyRate']()}</dt>
						<dd><Price value={accommodation.pricePerNightMinor} /></dd>
					</div>

					{#if nights > 0}
						<div class="flex flex-wrap justify-between gap-2">
							<dt class="text-muted-foreground">{m['BookingPage.BookingSummary.nights']()}</dt>
							<dd>{nights}</dd>
						</div>
						<div class="flex flex-wrap justify-between gap-2">
							<dt class="text-muted-foreground">{m['BookingPage.BookingSummary.guests']()}</dt>
							<dd>{guests}</dd>
						</div>
					{/if}

					<div class="flex flex-wrap justify-between gap-2">
						<dt class="text-muted-foreground">{m['BookingPage.BookingSummary.fees']()}</dt>
						<dd>{m['BookingPage.BookingSummary.unconfirmed']()}</dd>
					</div>
				</dl>
			</div>

			<div class="border-t pt-5" aria-live="polite" aria-atomic="true">
				<p class="text-sm font-medium">{m['BookingPage.BookingSummary.estimate']()}</p>
				{#if nights > 0}
					<p class="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
						<Price value={subtotalMinor} />
					</p>

					<p class="mt-2 text-xs text-muted-foreground">
						{m['BookingPage.BookingSummary.breakdown']({ nights })}
					</p>
				{:else}
					<p class="mt-2 text-sm leading-6 text-muted-foreground">
						{m['BookingPage.BookingSummary.chooseDates']()}
					</p>
				{/if}
			</div>
		</Card.Content>

		<Card.Footer
			><p class="text-xs leading-5 text-muted-foreground">
				{m['BookingPage.BookingSummary.disclaimer']()}
			</p></Card.Footer
		>
	</Card.Root>

	<p class="mt-4 flex items-start gap-2.5 px-1 text-xs leading-5 text-muted-foreground">
		<span class="mt-0.5 icon-[lucide--info] size-4 shrink-0" aria-hidden="true"></span>
		{m['BookingPage.BookingSummary.previewNotice']()}
	</p>
</aside>
