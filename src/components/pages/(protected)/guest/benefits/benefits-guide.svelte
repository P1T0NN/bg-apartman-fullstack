<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	const items = $derived([
		{
			id: 'qualify',
			title: m['BenefitsPage.BenefitsGuide.qualifyTitle'](),
			description: m['BenefitsPage.BenefitsGuide.qualifyDescription'](),
			open: true
		},
		{
			id: 'availability',
			title: m['BenefitsPage.BenefitsGuide.availabilityTitle'](),
			description: m['BenefitsPage.BenefitsGuide.availabilityDescription'](),
			open: false
		},
		{
			id: 'discounts',
			title: m['BenefitsPage.BenefitsGuide.discountsTitle'](),
			description: m['BenefitsPage.BenefitsGuide.discountsDescription'](),
			open: false
		},
		{
			id: 'progress',
			title: m['BenefitsPage.BenefitsGuide.progressTitle'](),
			description: m['BenefitsPage.BenefitsGuide.progressDescription'](),
			open: false
		}
	]);
</script>

<section aria-labelledby="loyalty-guide-title" class="flex flex-col gap-6">
	<h2 id="loyalty-guide-title" class="text-2xl font-semibold tracking-tight text-balance">
		{m['BenefitsPage.BenefitsGuide.title']()}
	</h2>

	<div class="divide-y rounded-2xl border bg-card px-5 text-card-foreground sm:px-6">
		{#each items as item (item.id)}
			<details class="group" open={item.open}>
				<summary
					class="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-base font-medium focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
				>
					{item.title}
					<span
						class="icon-[lucide--chevron-down] size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
						aria-hidden="true"
					></span>
				</summary>
				<p class="max-w-prose pb-5 text-sm leading-6 text-muted-foreground">
					{item.description}
				</p>
			</details>
		{/each}
	</div>
</section>

<style>
	/* Safari still draws its own disclosure triangle unless it is hidden explicitly */
	summary::-webkit-details-marker {
		display: none;
	}
</style>
