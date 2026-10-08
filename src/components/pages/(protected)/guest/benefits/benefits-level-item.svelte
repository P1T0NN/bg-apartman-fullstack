<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import * as Table from '@/components/ui/table/index.js';
	import { Badge } from '@/components/ui/badge/index.js';

	// TYPES
	import type { LOYALTY_LEVELS } from '@/shared/features/loyalty/data/loyaltyData.js';

	let {
		tier,
		currentLevel,
		desktop = false
	}: {
		tier: (typeof LOYALTY_LEVELS)[number];
		currentLevel: number;
		desktop?: boolean;
	} = $props();
	const breakfast = $derived(
		tier.breakfast === 'all'
			? m['BenefitsPage.BenefitsLevelItem.allGuests']()
			: tier.breakfast === 'up_to_two'
				? m['BenefitsPage.BenefitsLevelItem.twoGuests']()
				: m['BenefitsPage.BenefitsLevelItem.notIncluded']()
	);
</script>

{#if desktop}
	<Table.Row>
		<Table.Head scope="row" class="px-5 py-5">
			<div class="flex flex-col items-start gap-2">
				<span>{m['BenefitsPage.BenefitsLevelItem.level']({ level: tier.level })}</span>
				{#if currentLevel === tier.level}<Badge>
						{m['BenefitsPage.BenefitsLevelItem.current']()}
					</Badge>{/if}
			</div>
		</Table.Head>
		<Table.Cell>
			<span class="text-lg font-semibold tabular-nums">{tier.discount}%</span>
		</Table.Cell>
		<Table.Cell>{m['BenefitsPage.BenefitsLevelItem.included']()}</Table.Cell>
		<Table.Cell class="max-w-40 whitespace-normal">
			{tier.level >= 2
				? m['BenefitsPage.BenefitsLevelItem.breakfastIncluded']({ guests: breakfast })
				: breakfast}
		</Table.Cell>
		<Table.Cell class="pr-5">
			{tier.level === 3
				? m['BenefitsPage.BenefitsLevelItem.included']()
				: m['BenefitsPage.BenefitsLevelItem.notIncluded']()}
		</Table.Cell>
	</Table.Row>
{:else}
	<section class="flex flex-col gap-4 p-5 first:rounded-t-2xl last:rounded-b-2xl">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<h3 class="font-semibold">
				{m['BenefitsPage.BenefitsLevelItem.level']({ level: tier.level })}
			</h3>
			{#if currentLevel === tier.level}<Badge>
					{m['BenefitsPage.BenefitsLevelItem.current']()}
				</Badge>{/if}
		</div>
		<div class="flex items-baseline gap-3">
			<p class="text-3xl font-semibold tracking-tight">{tier.discount}%</p>
			<p class="text-sm text-muted-foreground">{m['BenefitsPage.BenefitsLevelItem.discount']()}</p>
		</div>
		<ul class="flex flex-col gap-2 text-sm">
			<li class="flex items-center gap-2">
				<span class="icon-[lucide--check] size-4 shrink-0" aria-hidden="true"></span>
				{m['BenefitsPage.BenefitsLevelItem.parking']()}
			</li>
			{#if tier.level >= 2}
				<li class="flex items-center gap-2">
					<span class="icon-[lucide--check] size-4 shrink-0" aria-hidden="true"></span>
					{m['BenefitsPage.BenefitsLevelItem.breakfast']({ guests: breakfast })}
				</li>
			{/if}
			{#if tier.level === 3}
				<li class="flex items-center gap-2">
					<span class="icon-[lucide--check] size-4 shrink-0" aria-hidden="true"></span>
					{m['BenefitsPage.BenefitsLevelItem.spa']()}
				</li>
			{/if}
		</ul>
	</section>
{/if}
