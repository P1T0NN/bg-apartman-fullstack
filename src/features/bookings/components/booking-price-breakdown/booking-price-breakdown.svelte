<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime.js';
	// COMPONENTS
	import Price from '@/components/ui/custom-components/price/price.svelte';
	import { Badge } from '@/components/ui/badge/index.js';
	import LoyaltyBookingBenefits from '@/features/loyalty/components/loyalty-booking-benefits/loyalty-booking-benefits.svelte';
	import type { LoyaltyBookingBenefits as LoyaltyBenefits } from '@/shared/features/loyalty/types/loyaltyTypes.js';
	// UTILS
	import { formatCurrency } from '@/shared/utils/currency.js';
	// TYPES
	import type {
		calculateStayPricing,
		NightlyPricing
	} from '@/shared/features/bookings/utils/calculateStayPricing.js';
	let {
		pricing,
		stayPricing,
		loyaltyBenefits,
		showTotal = true
	}: {
		pricing: NightlyPricing & { effectivePricePerNightMinor: number };
		stayPricing: ReturnType<typeof calculateStayPricing>;
		loyaltyBenefits?: LoyaltyBenefits;
		showTotal?: boolean;
	} = $props();

	const regularRate = $derived(
		loyaltyBenefits ? pricing.pricePerNightMinor : pricing.effectivePricePerNightMinor
	);
	const weekendRate = $derived(
		loyaltyBenefits
			? stayPricing.weekendBasePricePerNightMinor
			: stayPricing.weekendPricePerNightMinor
	);
	const regularTotalMinor = $derived(stayPricing.regularNights * regularRate);
	const weekendTotalMinor = $derived(stayPricing.weekendNights * (weekendRate ?? 0));
	// Compare original and accepted nightly totals, preserving per-night rounding and frozen receipts.
	const savingsMinor = $derived(
		stayPricing.regularNights * pricing.pricePerNightMinor +
			stayPricing.weekendNights * (stayPricing.weekendBasePricePerNightMinor ?? 0) -
			stayPricing.totalMinor
	);
	const hasWeekendNights = $derived(
		stayPricing.weekendNights > 0 && stayPricing.weekendPricePerNightMinor !== null
	);
</script>

<dl class="flex min-w-0 flex-col gap-4 text-sm">
	{#if stayPricing.regularNights > 0}
		<div class="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-1">
			<dt>
				{m['AccommodationsFeature.Pricing.regularNights']()}
			</dt>
			<dd class="col-start-1 row-start-2 text-xs text-muted-foreground tabular-nums">
				{stayPricing.regularNights} × <Price value={regularRate} />
			</dd>
			<dd class="col-start-2 row-span-2 row-start-1 text-right font-medium tabular-nums">
				<Price value={regularTotalMinor} />
			</dd>
		</div>
	{/if}
	{#if hasWeekendNights}
		<div class="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-1">
			<dt>
				{m['AccommodationsFeature.Pricing.weekendNights']()}
			</dt>
			<dd class="col-start-1 row-start-2 text-xs text-muted-foreground tabular-nums">
				{stayPricing.weekendNights} × <Price value={weekendRate!} />
			</dd>
			<dd class="col-start-2 row-span-2 row-start-1 text-right font-medium tabular-nums">
				<Price value={weekendTotalMinor} />
			</dd>
		</div>
	{/if}
	{#if loyaltyBenefits?.propertySavingsMinor}
		<div class="flex flex-wrap justify-between gap-2">
			<dt>
				{m['LoyaltyFeature.BookingBenefits.propertyDiscount']({
					percent: loyaltyBenefits.propertyDiscountBps / 100
				})}
			</dt>
			<dd class="font-medium tabular-nums">
				−<Price value={loyaltyBenefits.propertySavingsMinor} />
			</dd>
		</div>
	{/if}
	{#if loyaltyBenefits?.loyaltySavingsMinor}
		<div class="flex flex-wrap justify-between gap-2">
			<dt>
				{m['LoyaltyFeature.BookingBenefits.loyaltyDiscount']({
					percent: loyaltyBenefits.loyaltyDiscountBps / 100
				})}
			</dt>
			<dd class="font-medium tabular-nums">
				−<Price value={loyaltyBenefits.loyaltySavingsMinor} />
			</dd>
		</div>
	{/if}
	{#if showTotal}
		<div class="flex flex-wrap justify-between gap-2 border-t pt-4 font-semibold">
			<dt>{m['AccommodationsFeature.Pricing.total']()}</dt>
			<dd><Price value={stayPricing.totalMinor} /></dd>
		</div>
	{/if}
</dl>

{#if loyaltyBenefits}
	<div class="mt-5 border-t pt-4">
		<LoyaltyBookingBenefits benefits={loyaltyBenefits} />
	</div>
{:else if savingsMinor > 0}
	<div class="mt-4 flex flex-col gap-2">
		<p class="flex flex-wrap items-center gap-2 text-sm font-medium">
			<Badge variant="secondary" class="bg-success/10 text-success">
				{m['AccommodationsFeature.Pricing.discountLabel']({
					percent: new Intl.NumberFormat(getLocale()).format(pricing.discountBps / 100)
				})}
			</Badge>
			<span>
				{m['AccommodationsFeature.Pricing.savingsIncluded']({
					amount: formatCurrency(savingsMinor, getLocale())
				})}
			</span>
		</p>
		<p class="text-xs text-muted-foreground">
			{m['AccommodationsFeature.Pricing.discountIncluded']()}
		</p>
	</div>
{/if}
