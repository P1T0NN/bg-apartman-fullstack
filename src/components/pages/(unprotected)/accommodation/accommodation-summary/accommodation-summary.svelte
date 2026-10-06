<script lang="ts">
	// SVELTEKIT IMPORTS
	import { page } from '$app/state';

	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime.js';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// COMPONENTS
	import AccommodationBookingMode from '@/features/accommodations/components/accommodation-booking-mode/accommodation-booking-mode.svelte';
	import * as Card from '@/components/ui/card/index.js';
	import { Button } from '@/components/ui/button/index.js';
	import ButtonLink from '@/components/ui/custom-components/button-link/button-link.svelte';
	import Plural from '@/components/ui/custom-components/plural/plural.svelte';
	import Price from '@/components/ui/custom-components/price/price.svelte';
	import { Badge } from '@/components/ui/badge/index.js';

	// UTILS
	import { calculateDiscountedPrice } from '@/shared/features/accommodations/utils/calculateAccommodationPricing.js';

	// TYPES
	import type { PublicAccommodation } from '@/shared/features/accommodations/types/accommodationTypes.js';

	let { accommodation }: { accommodation: PublicAccommodation } = $props();
	const hasDiscount = $derived(
		accommodation.effectivePricePerNightMinor < accommodation.pricePerNightMinor
	);
	const weekendRate = $derived(
		accommodation.weekendPricePerNightMinor === null
			? null
			: calculateDiscountedPrice(accommodation.weekendPricePerNightMinor, accommodation.discountBps)
	);
	const hasDifferentWeekendRate = $derived(
		weekendRate !== null && weekendRate !== accommodation.effectivePricePerNightMinor
	);
</script>

<aside id="stay-price" aria-labelledby="stay-price-title" class="scroll-mt-24">
	<Card.Root class="rounded-2xl shadow-sm">
		<Card.Header>
			<Card.Title>
				<h2 id="stay-price-title">
					{m['AccommodationPage.AccommodationSummary.title']()}
				</h2>
			</Card.Title>
		</Card.Header>

		<Card.Content>
			<div>
				<p class="mb-1 text-sm text-muted-foreground">
					{m['AccommodationsFeature.Pricing.from']()}
				</p>
				<p class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
					<span class="text-3xl font-semibold tracking-tight tabular-nums">
						<Price value={accommodation.effectivePricePerNightMinor} />
					</span>
					<span class="text-sm text-muted-foreground">
						{m['AccommodationsFeature.AccommodationCard.night']()}
					</span>
				</p>
				{#if hasDiscount}
					<div class="mt-2 flex flex-wrap items-center gap-2">
						<span class="sr-only">{m['AccommodationsFeature.Pricing.original']()}</span>
						<s class="text-sm text-muted-foreground">
							<Price value={accommodation.pricePerNightMinor} />
						</s>
						<Badge variant="secondary" class="bg-success/10 text-success">
							{m['AccommodationsFeature.Pricing.discountLabel']({
								percent: new Intl.NumberFormat(getLocale()).format(accommodation.discountBps / 100)
							})}
						</Badge>
					</div>
				{/if}
			</div>
			{#if hasDifferentWeekendRate && weekendRate !== null}
				<p class="mt-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
					<span class="text-muted-foreground">
						{m['AccommodationPage.AccommodationSummary.weekendDays']()}
					</span>
					<span class="inline-flex items-baseline gap-1.5">
						<span class="font-medium tabular-nums"><Price value={weekendRate} /></span>
						<span class="text-xs text-muted-foreground">
							{m['AccommodationsFeature.AccommodationCard.night']()}
						</span>
					</span>
				</p>
			{/if}
			<dl class="mt-6 flex flex-col gap-4 border-t pt-5 text-sm">
				<div class="flex justify-between gap-4">
					<dt class="text-muted-foreground">
						{m['AccommodationPage.AccommodationSummary.minimum']()}
					</dt>

					<dd>
						<Plural
							count={accommodation.minimumStay}
							forms={{
								one: m['AccommodationPage.AccommodationSummary.night'](),
								other: m['AccommodationPage.AccommodationSummary.nights']()
							}}
						/>
					</dd>
				</div>

				{#if accommodation.maximumStay}
					<div class="flex justify-between gap-4">
						<dt class="text-muted-foreground">
							{m['AccommodationPage.AccommodationSummary.maximum']()}
						</dt>

						<dd>
							<Plural
								count={accommodation.maximumStay}
								forms={{
									one: m['AccommodationPage.AccommodationSummary.night'](),
									other: m['AccommodationPage.AccommodationSummary.nights']()
								}}
							/>
						</dd>
					</div>
				{/if}

				<div class="flex justify-between gap-4">
					<dt class="text-muted-foreground">
						{m['AccommodationPage.AccommodationSummary.capacity']()}
					</dt>
					<dd>{accommodation.maxGuests}</dd>
				</div>
			</dl>
		</Card.Content>

		<Card.Footer class="flex-col items-stretch gap-3">
			<AccommodationBookingMode mode={accommodation.bookingMode} compact />
			<ButtonLink
				href={`${UNPROTECTED_PAGE_ENDPOINTS.ACCOMMODATION(accommodation._id)}${page.url.search}#cancellation-policy`}
				variant="link"
				class="h-auto justify-start p-0"
			>
				{m['AccommodationPage.AccommodationSummary.cancellationDetails']()}
			</ButtonLink>
			<Button
				href={UNPROTECTED_PAGE_ENDPOINTS.BOOK_ACCOMMODATION(accommodation._id) + page.url.search}
				class="min-h-11"
			>
				{m['AccommodationPage.AccommodationSummary.planBooking']()}
			</Button>
			<p class="text-xs leading-5 text-muted-foreground">
				{m['AccommodationPage.AccommodationSummary.priceHint']()}
			</p>
		</Card.Footer>
	</Card.Root>
</aside>
