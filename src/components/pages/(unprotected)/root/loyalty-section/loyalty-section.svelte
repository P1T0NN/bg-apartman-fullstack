<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import Section from '@/components/ui/custom-components/section/section.svelte';
	import LoyaltyTierItem from './loyalty-tier-item.svelte';

	// DATA
	import { LOYALTY_LEVELS } from '@/shared/features/loyalty/data/loyaltyData.js';

	const uid = $props.id();

	const faqs = [
		{
			question: m['HomePage.LoyaltySection.accountQuestion'](),
			answer: m['HomePage.LoyaltySection.account']()
		},
		{
			question: m['HomePage.LoyaltySection.availabilityQuestion'](),
			answer: m['HomePage.LoyaltySection.availability']()
		},
		{
			question: m['HomePage.LoyaltySection.qualifyingQuestion'](),
			answer: m['HomePage.LoyaltySection.qualifying']()
		},
		{
			question: m['HomePage.LoyaltySection.futureBookingsQuestion'](),
			answer: m['HomePage.LoyaltySection.futureBookings']()
		},
		{
			question: m['HomePage.LoyaltySection.discountsQuestion'](),
			answer: m['HomePage.LoyaltySection.discounts']()
		}
	];
</script>

<Section id="loyalty" aria-labelledby={`${uid}-title`} class="scroll-mt-24">
	<div class="flex flex-col gap-10 sm:gap-12">
		<div class="flex max-w-2xl flex-col gap-3">
			<h2
				id={`${uid}-title`}
				class="text-3xl font-semibold tracking-tight text-balance sm:text-5xl"
			>
				{m['HomePage.LoyaltySection.title']()}
			</h2>

			<p class="text-base text-pretty text-muted-foreground sm:text-lg">
				{m['HomePage.LoyaltySection.description']({ stays: LOYALTY_LEVELS[0].stays })}
			</p>
		</div>

		<!-- One panel, three steps. The last step is dark: the top reward. -->
		<ul
			class="grid divide-y overflow-hidden rounded-3xl border md:grid-cols-3 md:divide-x md:divide-y-0"
		>
			{#each LOYALTY_LEVELS as tier, index (tier.level)}
				<LoyaltyTierItem {tier} featured={index === LOYALTY_LEVELS.length - 1} />
			{/each}
		</ul>

		<div class="grid gap-6 lg:grid-cols-[1fr_2fr] lg:gap-16">
			<h3 class="text-xl font-semibold tracking-tight">
				{m['HomePage.LoyaltySection.faqTitle']()}
			</h3>

			<div class="divide-y border-y">
				{#each faqs as faq (faq.question)}
					<details class="group py-5">
						<summary
							class="flex cursor-pointer list-none items-center justify-between gap-4 rounded-md font-medium focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none [&::-webkit-details-marker]:hidden"
						>
							{faq.question}
							<span
								class="icon-[lucide--chevron-down] size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
								aria-hidden="true"
							></span>
						</summary>

						<p class="mt-3 max-w-prose text-sm leading-6 text-pretty text-muted-foreground">
							{faq.answer}
						</p>
					</details>
				{/each}
			</div>
		</div>
	</div>
</Section>
