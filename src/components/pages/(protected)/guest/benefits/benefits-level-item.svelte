<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import { Badge } from '@/components/ui/badge/index.js';

	// TYPES
	import type { LoyaltyTier } from '@/shared/features/loyalty/types/loyaltyTypes.js';

	let {
		tier,
		currentLevel
	}: {
		tier: LoyaltyTier;
		currentLevel: number;
	} = $props();

	const isCurrent = $derived(currentLevel === tier.level);

	const guests = $derived(
		tier.breakfast === 'all'
			? m['BenefitsPage.BenefitsLevelItem.allGuests']()
			: tier.breakfast === 'up_to_two'
				? m['BenefitsPage.BenefitsLevelItem.twoGuests']()
				: m['BenefitsPage.BenefitsLevelItem.notIncluded']()
	);

	const hasBreakfast = $derived(tier.level >= 2);
	const hasSpa = $derived(tier.level === 3);
</script>

{#snippet included(text: string)}
	<li class="flex items-center gap-2.5">
		<span class="grid size-5 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
			<span class="icon-[lucide--check] size-3" aria-hidden="true"></span>
		</span>
		{text}
	</li>
{/snippet}

{#snippet missing(label: string)}
	<li class="flex items-center gap-2.5 text-muted-foreground">
		<span class="grid size-5 shrink-0 place-items-center rounded-full bg-muted">
			<span class="icon-[lucide--minus] size-3" aria-hidden="true"></span>
		</span>
		<span class="line-through decoration-muted-foreground/50">{label}</span>
		<span class="sr-only">{m['BenefitsPage.BenefitsLevelItem.notIncluded']()}</span>
	</li>
{/snippet}

<li
	class="flex flex-col rounded-2xl border bg-card text-card-foreground transition-colors {isCurrent
		? 'border-primary shadow-sm ring-1 ring-primary'
		: ''}"
	aria-current={isCurrent ? 'true' : undefined}
>
	<div class="flex flex-col gap-4 p-5 sm:p-6">
		<div class="flex min-h-6 items-center justify-between gap-3">
			<h3 class="font-semibold">
				{m['BenefitsPage.BenefitsLevelItem.level']({ level: tier.level })}
			</h3>
			{#if isCurrent}
				<Badge>{m['BenefitsPage.BenefitsLevelItem.current']()}</Badge>
			{/if}
		</div>

		<div class="flex flex-col gap-1">
			<p class="flex items-start leading-none font-semibold tracking-tighter tabular-nums">
				<span class="text-6xl">{tier.discount}</span>
				<span class="mt-1 text-2xl">%</span>
			</p>
			<p class="text-sm text-muted-foreground">{m['BenefitsPage.BenefitsLevelItem.discount']()}</p>
		</div>

		<p class="text-xs text-muted-foreground">
			{m['BenefitsPage.BenefitsLevelItem.threshold']({ stays: tier.stays })}
		</p>
	</div>

	<ul class="flex flex-1 flex-col gap-3 border-t border-dashed p-5 text-sm sm:p-6">
		{@render included(m['BenefitsPage.BenefitsLevelItem.parking']())}

		{#if hasBreakfast}
			{@render included(m['BenefitsPage.BenefitsLevelItem.breakfast']({ guests }))}
		{:else}
			{@render missing(m['BenefitsPage.BenefitsLevels.breakfast']())}
		{/if}

		{#if hasSpa}
			{@render included(m['BenefitsPage.BenefitsLevelItem.spa']())}
		{:else}
			{@render missing(m['BenefitsPage.BenefitsLevels.spa']())}
		{/if}
	</ul>
</li>
