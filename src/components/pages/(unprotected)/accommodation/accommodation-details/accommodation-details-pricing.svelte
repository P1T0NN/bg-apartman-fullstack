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
	class="scroll-mt-32 py-9 lg:hidden"
	aria-labelledby="mobile-stay-pricing-title"
>
	<h2 id="mobile-stay-pricing-title" class="text-2xl font-semibold tracking-tight">
		{m['AccommodationPage.AccommodationDetailsPricing.title']()}
	</h2>

	<div class="mt-6 rounded-xl border p-5">
		<dl class="flex flex-col divide-y text-sm">
			<div class="flex flex-wrap items-baseline justify-between gap-3 pb-4">
				<dt class="text-muted-foreground">{m['BookingPage.BookSummary.nightlyRate']()}</dt>
				<dd class="text-base font-semibold"><AccommodationPrice pricing={accommodation} /></dd>
			</div>

			{#if hasDifferentWeekendRate && accommodation.weekendPricePerNightMinor !== null && weekendRate !== null}
				<div class="flex flex-wrap items-baseline justify-between gap-3 py-4">
					<dt>
						<span class="text-muted-foreground">
							{m['AccommodationsFeature.Pricing.weekend']()}
						</span>
						<span class="mt-1 block text-xs text-muted-foreground">
							{m['AccommodationPage.AccommodationDetailsPricing.weekendNights']()}
						</span>
					</dt>
					<dd class="text-base font-semibold">
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

		<p class="mt-4 border-t pt-4 text-xs leading-5 text-muted-foreground">
			{m['AccommodationPage.AccommodationDetailsPricing.hint']()}
		</p>
	</div>

	<div class="mt-4">
		<AccommodationBookingMode mode={accommodation.bookingMode} />
	</div>
</section>
