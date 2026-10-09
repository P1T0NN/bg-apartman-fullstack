<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { LoyaltyTier } from '@/shared/features/loyalty/types/loyaltyTypes.js';

	let { tier, featured = false }: { tier: LoyaltyTier; featured?: boolean } = $props();
</script>

{#snippet benefit(icon: string, label: string)}
	<li class="flex items-start gap-3">
		<span
			class={cn(
				icon,
				'mt-0.5 size-4 shrink-0',
				featured ? 'text-header-foreground' : 'text-primary'
			)}
			aria-hidden="true"
		></span>
		{label}
	</li>
{/snippet}

<li
	class={cn(
		'flex flex-col gap-8 p-6 sm:p-8',
		featured ? 'bg-header text-header-foreground' : 'bg-background'
	)}
>
	<div class="flex flex-col gap-1">
		<h3 class="text-base font-semibold">
			{m['HomePage.LoyaltyTierItem.level']({ level: tier.level })}
		</h3>

		<p class={cn('text-sm', featured ? 'text-header-foreground/70' : 'text-muted-foreground')}>
			{m['HomePage.LoyaltyTierItem.threshold']({ stays: tier.stays })}
		</p>
	</div>

	<p class="flex flex-col gap-1">
		<span class="text-6xl leading-none font-semibold tracking-tight tabular-nums sm:text-7xl">
			{tier.discount}%
		</span>

		<span class={cn('text-sm', featured ? 'text-header-foreground/70' : 'text-muted-foreground')}>
			{m['HomePage.LoyaltyTierItem.discount']()}
		</span>
	</p>

	<ul
		class={cn(
			'flex flex-col gap-3 border-t pt-6 text-sm',
			featured ? 'border-header-foreground/15' : 'border-border'
		)}
	>
		{#if tier.parking}
			{@render benefit('icon-[lucide--car-front]', m['LoyaltyFeature.BookingBenefits.parking']())}
		{/if}

		{#if tier.breakfast !== 'none'}
			{@render benefit(
				'icon-[lucide--coffee]',
				tier.breakfast === 'all'
					? m['LoyaltyFeature.BookingBenefits.breakfastAll']()
					: m['LoyaltyFeature.BookingBenefits.breakfastTwo']()
			)}
		{/if}

		{#if tier.spa}
			{@render benefit('icon-[lucide--waves]', m['LoyaltyFeature.BookingBenefits.spa']())}
		{/if}
	</ul>
</li>
