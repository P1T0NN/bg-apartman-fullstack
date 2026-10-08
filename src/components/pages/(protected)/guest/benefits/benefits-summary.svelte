<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime.js';

	// COMPONENTS
	import * as Card from '@/components/ui/card/index.js';
	import { Badge } from '@/components/ui/badge/index.js';
	import { Button } from '@/components/ui/button/index.js';

	// UTILS
	import { formatDate } from '@/shared/utils/date.js';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';
	import { LOYALTY_LEVELS } from '@/shared/features/loyalty/data/loyaltyData.js';

	// TYPES
	import type { FunctionReturnType } from 'convex/server';
	import type { api } from '@convex/_generated/api';

	let {
		benefits
	}: {
		benefits: FunctionReturnType<
			typeof api.tables.loyaltyMemberships.queries.fetchMyBenefits.fetchMyBenefits
		>;
	} = $props();
	const reward = $derived(LOYALTY_LEVELS.find((tier) => tier.level === benefits.level));
</script>

<section aria-labelledby="current-benefits-title">
	<Card.Root>
		<Card.Header>
			<Card.Title>
				<h2 id="current-benefits-title">{m['BenefitsPage.BenefitsSummary.title']()}</h2>
			</Card.Title>
			<Card.Action>
				<Badge variant="secondary">
					{reward
						? m['BenefitsPage.BenefitsLevelItem.level']({ level: reward.level })
						: m['BenefitsPage.BenefitsSummary.comingSoon']()}
				</Badge>
			</Card.Action>
		</Card.Header>
		<Card.Content>
			<div class="grid gap-7 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
				<div class="flex flex-col items-start gap-3">
					{#if reward}
						<p class="text-7xl font-semibold tracking-tighter tabular-nums">
							{reward.discount}
							<span class="text-4xl">%</span>
						</p>
						<p class="font-medium">{m['BenefitsPage.BenefitsSummary.levelRewards']()}</p>
						<ul class="flex flex-col gap-2 text-sm">
							<li>{m['LoyaltyFeature.BookingBenefits.parking']()}</li>
							{#if reward.breakfast !== 'none'}
								<li>
									{reward.breakfast === 'all'
										? m['LoyaltyFeature.BookingBenefits.breakfastAll']()
										: m['LoyaltyFeature.BookingBenefits.breakfastTwo']()}
								</li>
							{/if}
							{#if reward.spa}<li>{m['LoyaltyFeature.BookingBenefits.spa']()}</li>{/if}
						</ul>
					{:else}
						<h3 class="max-w-sm text-3xl font-semibold tracking-tight">
							{benefits.qualifyingStays === 0
								? m['BenefitsPage.BenefitsSummary.startTitle']()
								: m['BenefitsPage.BenefitsSummary.returningTitle']()}
						</h3>
						<p class="max-w-sm text-sm leading-6 text-muted-foreground">
							{m['BenefitsPage.BenefitsSummary.startDescription']()}
						</p>
					{/if}
				</div>
				<div class="flex flex-col gap-3 lg:border-l lg:pl-10" aria-live="polite" aria-atomic="true">
					<p class="text-7xl font-semibold tracking-tighter tabular-nums">
						{benefits.qualifyingStays}
					</p>
					<p class="text-sm font-medium">{m['BenefitsPage.BenefitsSummary.recordedStays']()}</p>
					<p class="max-w-md text-xs leading-5 text-muted-foreground">
						{m['BenefitsPage.BenefitsSummary.staysDescription']()}
					</p>
					{#if benefits.joinedAt !== null}
						<p class="text-xs text-muted-foreground">
							{m['BenefitsPage.BenefitsSummary.joined']({
								date: formatDate(benefits.joinedAt, getLocale())
							})}
						</p>
					{/if}
				</div>
			</div>
		</Card.Content>
		<Card.Footer
			class="flex-col items-start gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between"
		>
			<p class="max-w-prose text-sm leading-6 text-muted-foreground">
				{m['BenefitsPage.BenefitsSummary.availability']()}
			</p>
			<Button href={UNPROTECTED_PAGE_ENDPOINTS.SEARCH} class="min-h-11 shrink-0">
				{m['BenefitsPage.BenefitsSummary.findStay']()}
				<span class="icon-[lucide--arrow-right]" data-icon="inline-end" aria-hidden="true"></span>
			</Button>
		</Card.Footer>
	</Card.Root>
</section>
