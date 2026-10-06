<script lang="ts">
	// COMPONENTS
	import AccommodationPrice from '@/features/accommodations/components/accommodation-price/accommodation-price.svelte';
	import AccommodationBookingMode from '@/features/accommodations/components/accommodation-booking-mode/accommodation-booking-mode.svelte';
	// UTILS
	import { m } from '@/lib/paraglide/messages';
	import { calculateDiscountedPrice } from '@/shared/features/accommodations/utils/calculateAccommodationPricing.js';
	// TYPES
	import type { PublicAccommodation } from '@/shared/features/accommodations/types/accommodationTypes.js';
	let { accommodation }: { accommodation: PublicAccommodation } = $props();
	const weekendRate = $derived(
		accommodation.weekendPricePerNightMinor === null
			? null
			: calculateDiscountedPrice(accommodation.weekendPricePerNightMinor, accommodation.discountBps)
	);
	const hasDifferentWeekendRate = $derived(
		weekendRate !== null && weekendRate !== accommodation.effectivePricePerNightMinor
	);
</script>

<section
	id="mobile-stay-pricing"
	class="scroll-mt-24 py-9 lg:hidden"
	aria-labelledby="mobile-stay-pricing-title"
>
	<h2 id="mobile-stay-pricing-title" class="text-2xl font-semibold tracking-tight">
		{m['AccommodationPage.AccommodationDetailsPricing.title']()}
	</h2>
	<dl class="my-6 flex flex-col gap-5 text-sm">
		<div class="flex flex-wrap items-baseline justify-between gap-3">
			<dt class="text-muted-foreground">{m['BookingPage.BookSummary.nightlyRate']()}</dt>
			<dd class="font-medium"><AccommodationPrice pricing={accommodation} /></dd>
		</div>
		{#if hasDifferentWeekendRate && accommodation.weekendPricePerNightMinor !== null && weekendRate !== null}
			<div class="flex flex-wrap items-baseline justify-between gap-3">
				<dt>
					<span class="text-muted-foreground">{m['AccommodationsFeature.Pricing.weekend']()}</span>
					<span class="mt-1 block text-xs text-muted-foreground">
						{m['AccommodationPage.AccommodationDetailsPricing.weekendNights']()}
					</span>
				</dt>
				<dd class="font-medium">
					<AccommodationPrice
						pricing={{
							pricePerNightMinor: accommodation.weekendPricePerNightMinor,
							discountBps: accommodation.discountBps,
							effectivePricePerNightMinor: weekendRate
						}}
					/>
				</dd>
			</div>
		{/if}
	</dl>
	<p class="mb-5 text-xs leading-5 text-muted-foreground">
		{m['AccommodationPage.AccommodationDetailsPricing.hint']()}
	</p>
	<AccommodationBookingMode mode={accommodation.bookingMode} />
</section>
