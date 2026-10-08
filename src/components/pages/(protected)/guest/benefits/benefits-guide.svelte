<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
</script>

<section aria-labelledby="loyalty-guide-title" class="flex flex-col gap-4">
	<h2 id="loyalty-guide-title" class="text-xl font-semibold tracking-tight">
		{m['BenefitsPage.BenefitsGuide.title']()}
	</h2>
	<div class="divide-y border-y">
		<details class="group" open>
			<summary
				class="cursor-pointer py-4 pr-2 text-sm font-medium focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
			>
				{m['BenefitsPage.BenefitsGuide.qualifyTitle']()}
			</summary>
			<p class="max-w-prose pb-4 text-sm leading-6 text-muted-foreground">
				{m['BenefitsPage.BenefitsGuide.qualifyDescription']()}
			</p>
		</details>
		<details>
			<summary
				class="cursor-pointer py-4 pr-2 text-sm font-medium focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
			>
				{m['BenefitsPage.BenefitsGuide.availabilityTitle']()}
			</summary>
			<p class="max-w-prose pb-4 text-sm leading-6 text-muted-foreground">
				{m['BenefitsPage.BenefitsGuide.availabilityDescription']()}
			</p>
		</details>
		<details>
			<summary
				class="cursor-pointer py-4 pr-2 text-sm font-medium focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
			>
				{m['BenefitsPage.BenefitsGuide.discountsTitle']()}
			</summary>
			<p class="max-w-prose pb-4 text-sm leading-6 text-muted-foreground">
				{m['BenefitsPage.BenefitsGuide.discountsDescription']()}
			</p>
		</details>
		<details>
			<summary
				class="cursor-pointer py-4 pr-2 text-sm font-medium focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
			>
				{m['BenefitsPage.BenefitsGuide.progressTitle']()}
			</summary>
			<p class="max-w-prose pb-4 text-sm leading-6 text-muted-foreground">
				{m['BenefitsPage.BenefitsGuide.progressDescription']()}
			</p>
		</details>
	</div>
</section>
