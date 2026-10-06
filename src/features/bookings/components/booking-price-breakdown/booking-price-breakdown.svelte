<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime.js';
	// COMPONENTS
	import Price from '@/components/ui/custom-components/price/price.svelte';
	import { Badge } from '@/components/ui/badge/index.js';
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
		showTotal = true
	}: {
		pricing: NightlyPricing & { effectivePricePerNightMinor: number };
		stayPricing: ReturnType<typeof calculateStayPricing>;
		showTotal?: boolean;
	} = $props();

	const regularTotalMinor = $derived(
		stayPricing.regularNights * pricing.effectivePricePerNightMinor
	);
	const weekendTotalMinor = $derived(
		stayPricing.weekendNights * (stayPricing.weekendPricePerNightMinor ?? 0)
	);
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
				{stayPricing.regularNights} × <Price value={pricing.effectivePricePerNightMinor} />
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
				{stayPricing.weekendNights} × <Price value={stayPricing.weekendPricePerNightMinor!} />
			</dd>
			<dd class="col-start-2 row-span-2 row-start-1 text-right font-medium tabular-nums">
				<Price value={weekendTotalMinor} />
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

{#if savingsMinor > 0}
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
