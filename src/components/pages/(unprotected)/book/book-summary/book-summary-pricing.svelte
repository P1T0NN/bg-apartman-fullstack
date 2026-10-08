<script lang="ts">
	// COMPONENTS
	import BookingPriceBreakdown from '@/features/bookings/components/booking-price-breakdown/booking-price-breakdown.svelte';
	import Price from '@/components/ui/custom-components/price/price.svelte';
	import { Separator } from '@/components/ui/separator/index.js';
	import { Badge } from '@/components/ui/badge/index.js';
	import LoyaltyBookingBenefits from '@/features/loyalty/components/loyalty-booking-benefits/loyalty-booking-benefits.svelte';
	// UTILS
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime.js';
	import { formatDate } from '@/shared/utils/date.js';
	import type { calculateLoyaltyQuote } from '@/shared/features/loyalty/utils/calculateLoyaltyQuote.js';
	// TYPES
	import type { PublicAccommodation } from '@/shared/features/accommodations/types/accommodationTypes.js';

	let {
		accommodation,
		quote,
		checkInDate,
		checkOutDate,
		guests
	}: {
		accommodation: PublicAccommodation;
		quote: ReturnType<typeof calculateLoyaltyQuote>;
		checkInDate: string;
		checkOutDate: string;
		guests: number;
	} = $props();

	const stayPricing = $derived(quote.stayPricing);
	const nights = $derived(stayPricing.regularNights + stayPricing.weekendNights);
	const hasDiscount = $derived(
		accommodation.effectivePricePerNightMinor < accommodation.pricePerNightMinor
	);
</script>

<div class="flex min-w-0 flex-col gap-5">
	{#if nights > 0}
		<div class="flex flex-col gap-1.5 text-sm">
			<p class="flex flex-wrap items-baseline gap-x-1.5 font-medium">
				<time datetime={checkInDate}>{formatDate(Date.parse(checkInDate), getLocale())}</time>
				<span aria-hidden="true">–</span>
				<span class="sr-only">{m['BookingsFeature.BookingStayDatesHeader.checkOut']()}</span>
				<time datetime={checkOutDate}>{formatDate(Date.parse(checkOutDate), getLocale())}</time>
			</p>
			<p class="text-muted-foreground">
				{m['BookingPage.BookSummary.nights']()}: {nights}
				<span class="px-1" aria-hidden="true">·</span>
				{m['BookingPage.BookSummary.guests']()}: {guests}
			</p>
		</div>
		<Separator />
		<div>
			<BookingPriceBreakdown
				pricing={quote.pricing}
				{stayPricing}
				loyaltyBenefits={quote.benefits ?? undefined}
				showTotal={false}
			/>
		</div>
		<Separator />
		<div
			class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1"
			aria-live="polite"
			aria-atomic="true"
		>
			<p class="text-sm font-medium">{m['BookingPage.BookSummary.estimate']()}</p>
			<p class="text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
				<Price value={stayPricing.totalMinor} />
			</p>
		</div>
	{:else}
		<div class="flex flex-wrap items-baseline justify-between gap-2">
			<p class="text-sm text-muted-foreground">{m['BookingPage.BookSummary.nightlyRate']()}</p>
			<p class="flex flex-wrap items-baseline gap-2 text-xl font-semibold tabular-nums">
				<span class="text-sm font-normal text-muted-foreground">
					{m['AccommodationsFeature.Pricing.from']()}
				</span>
				<Price value={quote.pricing.effectivePricePerNightMinor} />
				{#if hasDiscount && !quote.benefits}
					<Badge variant="secondary" class="bg-success/10 text-success">
						{m['AccommodationsFeature.Pricing.discountLabel']({
							percent: new Intl.NumberFormat(getLocale()).format(accommodation.discountBps / 100)
						})}
					</Badge>
				{/if}
			</p>
		</div>
		{#if quote.benefits}
			{#if quote.benefits.loyaltyDiscountBps > 0}
				<p class="text-sm text-muted-foreground">
					{m['LoyaltyFeature.BookingBenefits.loyaltyDiscount']({
						percent: quote.benefits.loyaltyDiscountBps / 100
					})}
				</p>
			{/if}
			<LoyaltyBookingBenefits benefits={quote.benefits} />
		{/if}
		<p class="text-sm leading-6 text-muted-foreground">
			{m['BookingPage.BookSummary.chooseDates']()}
		</p>
	{/if}
	<p class="text-xs leading-5 text-muted-foreground">{m['BookingPage.BookSummary.disclaimer']()}</p>
</div>
