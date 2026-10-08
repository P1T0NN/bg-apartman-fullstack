<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import * as Table from '@/components/ui/table/index.js';
	import BenefitsLevelItem from './benefits-level-item.svelte';

	// CONFIG
	import { LOYALTY_LEVELS } from '@/shared/features/loyalty/data/loyaltyData.js';
	let { currentLevel = 0 }: { currentLevel?: number } = $props();
</script>

<section aria-labelledby="loyalty-levels-title" class="flex flex-col gap-4">
	<div class="flex flex-col gap-1.5">
		<h2 id="loyalty-levels-title" class="text-xl font-semibold tracking-tight">
			{m['BenefitsPage.BenefitsLevels.title']()}
		</h2>
		<p class="text-sm leading-6 text-muted-foreground">
			{m['BenefitsPage.BenefitsLevels.description']()}
		</p>
	</div>
	<div class="hidden overflow-hidden rounded-2xl border lg:block">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head class="px-5">{m['BenefitsPage.BenefitsLevels.level']()}</Table.Head>
					<Table.Head>{m['BenefitsPage.BenefitsLevels.discount']()}</Table.Head>
					<Table.Head>{m['BenefitsPage.BenefitsLevels.parking']()}</Table.Head>
					<Table.Head>{m['BenefitsPage.BenefitsLevels.breakfast']()}</Table.Head>
					<Table.Head class="pr-5">{m['BenefitsPage.BenefitsLevels.spa']()}</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each LOYALTY_LEVELS as tier (tier.level)}
					<BenefitsLevelItem {tier} {currentLevel} desktop />
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
	<div class="flex flex-col divide-y rounded-2xl border lg:hidden">
		{#each LOYALTY_LEVELS as tier (tier.level)}
			<BenefitsLevelItem {tier} {currentLevel} />
		{/each}
	</div>
	<p class="text-xs leading-5 text-muted-foreground">
		{m['BenefitsPage.BenefitsLevels.availabilityNote']()}
	</p>
</section>
