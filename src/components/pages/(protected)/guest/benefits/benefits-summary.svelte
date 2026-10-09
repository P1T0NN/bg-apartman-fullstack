<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime.js';

	// COMPONENTS
	import TicketCard from '@/components/ui/custom-components/ticket-card/ticket-card.svelte';
	import { Badge } from '@/components/ui/badge/index.js';
	import { Button } from '@/components/ui/button/index.js';
	import { Progress } from '@/components/ui/progress/index.js';

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
	const next = $derived(LOYALTY_LEVELS.find((tier) => tier.level > benefits.level));
</script>

{#snippet perk(text: string)}
	<li class="flex items-center gap-2.5">
		<span class="grid size-5 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
			<span class="icon-[lucide--check] size-3" aria-hidden="true"></span>
		</span>
		{text}
	</li>
{/snippet}

<section aria-labelledby="current-benefits-title">
	<TicketCard bodyClass="flex flex-col gap-8" stubClass="flex flex-col gap-3">
		<!-- BODY: current level and what it unlocks -->
		{#snippet body()}
			<div class="flex items-center justify-between gap-3">
				<h2 id="current-benefits-title" class="text-lg font-semibold tracking-tight">
					{m['BenefitsPage.BenefitsSummary.title']()}
				</h2>
				<Badge variant="secondary">
					{reward
						? m['BenefitsPage.BenefitsLevelItem.level']({ level: reward.level })
						: m['BenefitsPage.BenefitsSummary.notMember']()}
				</Badge>
			</div>

			{#if reward}
				<div class="flex flex-col gap-6">
					<p class="flex items-start leading-none font-semibold tracking-tighter tabular-nums">
						<span class="text-8xl sm:text-9xl">{reward.discount}</span>
						<span class="mt-2 text-4xl sm:mt-4 sm:text-5xl">%</span>
					</p>

					<div class="flex flex-col gap-3">
						<p class="font-medium">{m['BenefitsPage.BenefitsSummary.levelRewards']()}</p>
						<ul class="flex flex-col gap-2.5 text-sm">
							{@render perk(m['LoyaltyFeature.BookingBenefits.parking']())}
							{#if reward.breakfast !== 'none'}
								{@render perk(
									reward.breakfast === 'all'
										? m['LoyaltyFeature.BookingBenefits.breakfastAll']()
										: m['LoyaltyFeature.BookingBenefits.breakfastTwo']()
								)}
							{/if}
							{#if reward.spa}
								{@render perk(m['LoyaltyFeature.BookingBenefits.spa']())}
							{/if}
						</ul>
					</div>
				</div>
			{:else}
				<div class="flex flex-col gap-3">
					<h3 class="max-w-md text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
						{benefits.qualifyingStays === 0
							? m['BenefitsPage.BenefitsSummary.startTitle']()
							: m['BenefitsPage.BenefitsSummary.returningTitle']()}
					</h3>
					<p class="max-w-md text-sm leading-6 text-muted-foreground">
						{m['BenefitsPage.BenefitsSummary.startDescription']()}
					</p>
				</div>
			{/if}

			<div
				class="mt-auto flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between"
			>
				<p class="max-w-prose text-sm leading-6 text-muted-foreground">
					{m['BenefitsPage.BenefitsSummary.availability']()}
				</p>
				<Button
					href={UNPROTECTED_PAGE_ENDPOINTS.SEARCH}
					class="h-12 shrink-0 rounded-xl px-6 text-base font-semibold"
				>
					{m['BenefitsPage.BenefitsSummary.findStay']()}
					<span class="icon-[lucide--arrow-right]" data-icon="inline-end" aria-hidden="true"></span>
				</Button>
			</div>
		{/snippet}

		<!-- STUB: stays and progress -->
		{#snippet stub()}
			<div class="flex flex-col gap-3" aria-live="polite" aria-atomic="true">
				<p class="text-7xl leading-none font-semibold tracking-tighter tabular-nums">
					{benefits.qualifyingStays}
				</p>
				<p class="text-sm font-medium">{m['BenefitsPage.BenefitsSummary.recordedStays']()}</p>

				<div class="mt-3 flex flex-col gap-3">
					{#if next}
						<p class="text-sm font-medium text-balance">
							{m['BenefitsPage.BenefitsSummary.nextLevel']({
								stays: Math.max(0, next.stays - benefits.qualifyingStays),
								level: next.level,
								percent: next.discount
							})}
						</p>
						<Progress
							value={Math.min(100, (benefits.qualifyingStays / next.stays) * 100)}
							aria-label={m['BenefitsPage.BenefitsSummary.progress']({ level: next.level })}
						/>
					{:else}
						<p class="text-sm font-medium">{m['BenefitsPage.BenefitsSummary.highestLevel']()}</p>
					{/if}
				</div>

				<p class="mt-3 text-xs leading-5 text-muted-foreground">
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
		{/snippet}
	</TicketCard>
</section>
