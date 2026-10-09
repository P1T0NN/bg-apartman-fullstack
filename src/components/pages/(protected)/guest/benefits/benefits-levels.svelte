<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import BenefitsLevelItem from './benefits-level-item.svelte';

	// CONFIG
	import { LOYALTY_LEVELS } from '@/shared/features/loyalty/data/loyaltyData.js';

	let { currentLevel = 0 }: { currentLevel?: number } = $props();
</script>

<section aria-labelledby="loyalty-levels-title" class="flex flex-col gap-6">
	<div class="flex flex-col gap-2">
		<h2 id="loyalty-levels-title" class="text-2xl font-semibold tracking-tight">
			{m['BenefitsPage.BenefitsLevels.title']()}
		</h2>
		<p class="max-w-xl text-base leading-7 text-muted-foreground">
			{m['BenefitsPage.BenefitsLevels.description']()}
		</p>
	</div>

	<ol class="grid gap-4 lg:grid-cols-3">
		{#each LOYALTY_LEVELS as tier (tier.level)}
			<BenefitsLevelItem {tier} {currentLevel} />
		{/each}
	</ol>

	<p class="text-xs leading-5 text-muted-foreground">
		{m['BenefitsPage.BenefitsLevels.availabilityNote']()}
	</p>
</section>
