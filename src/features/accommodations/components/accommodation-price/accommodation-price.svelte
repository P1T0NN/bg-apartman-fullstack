<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime';
	// COMPONENTS
	import Price from '@/components/ui/custom-components/price/price.svelte';
	import { Badge } from '@/components/ui/badge/index.js';
	// TYPES
	import type { Doc } from '@convex/_generated/dataModel';
	let {
		pricing,
		loyaltyDiscountBps = 0
	}: {
		pricing: Pick<
			Doc<'accommodations'>,
			'pricePerNightMinor' | 'discountBps' | 'effectivePricePerNightMinor'
		>;
		loyaltyDiscountBps?: number;
	} = $props();
	const hasLoyaltyDiscount = $derived(loyaltyDiscountBps > 0);
</script>

<span class="inline-flex flex-wrap items-center gap-2 tabular-nums">
	{#if pricing.effectivePricePerNightMinor < pricing.pricePerNightMinor}
		<span class="sr-only">{m['AccommodationsFeature.Pricing.original']()}</span>
		<s class="text-sm font-normal text-muted-foreground">
			<Price value={pricing.pricePerNightMinor} />
		</s>
	{/if}
	<Price value={pricing.effectivePricePerNightMinor} />
	{#if pricing.effectivePricePerNightMinor < pricing.pricePerNightMinor}
		<Badge
			variant="secondary"
			class={hasLoyaltyDiscount ? 'bg-success text-success-foreground' : undefined}
		>
			{#if hasLoyaltyDiscount}
				{m['AccommodationsFeature.Pricing.loyaltyDiscountLabel']({
					percent: new Intl.NumberFormat(getLocale()).format(loyaltyDiscountBps / 100)
				})}
			{:else}
				{m['AccommodationsFeature.Pricing.discountLabel']({
					percent: new Intl.NumberFormat(getLocale()).format(pricing.discountBps / 100)
				})}
			{/if}
		</Badge>
	{/if}
</span>
