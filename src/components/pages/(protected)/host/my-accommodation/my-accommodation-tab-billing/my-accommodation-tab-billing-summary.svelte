<script lang="ts">
	// LIBRARIES
	import { getLocale } from '@/lib/paraglide/runtime.js';

	// MESSAGES
	import { m } from '@/lib/paraglide/messages.js';

	// COMPONENTS
	import * as Card from '@/components/ui/card/index.js';
	import AccommodationBillingStatusBadge from '@/features/accommodations/components/accommodation-billing-status-badge/accommodation-billing-status-badge.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// HOOKS
	import { useClock } from '@/hooks/useClock.svelte.js';

	// TYPES
	import type { FunctionReturnType } from 'convex/server';
	import type { api } from '@convex/_generated/api.js';

	let {
		data
	}: {
		data: NonNullable<
			FunctionReturnType<
				typeof api.tables.accommodations.queries.fetchMyAccommodationSettings.fetchMyAccommodationSettings
			>
		>['billing'];
	} = $props();

	const clock = useClock();
	const isFlatFee = $derived(data.billingPlanId === 'flat_fee');
	const isExpired = $derived(
		isFlatFee && data.billingPeriodEndsAt != null && data.billingPeriodEndsAt <= clock.now
	);
	const requiresPayment = $derived(isFlatFee && (data.billingStatus !== 'active' || isExpired));
	const paidUntil = $derived(
		data.billingPeriodEndsAt == null
			? null
			: new Intl.DateTimeFormat(getLocale(), { dateStyle: 'medium', timeStyle: 'short' }).format(
					data.billingPeriodEndsAt
				)
	);

	const planName = $derived(
		data.billingPlanId === 'free'
			? m['MyAccommodationPage.MyAccommodationTabBillingSummary.free']()
			: isFlatFee
				? m['MyAccommodationPage.MyAccommodationTabBillingSummary.flatFee']()
				: m['MyAccommodationPage.MyAccommodationTabBillingSummary.bookingFee']()
	);
	const visibility = $derived(
		requiresPayment ? 'hidden' : data.status === 'published' ? 'visible' : 'paused'
	);
</script>

<div class="flex flex-col gap-4">
	<!-- The answer hosts care about first: can guests see my listing? -->
	<div
		class={cn(
			'flex items-center gap-3 rounded-2xl px-5 py-4 text-sm font-medium',
			visibility === 'hidden' && 'bg-destructive/10 text-destructive',
			visibility === 'visible' && 'bg-success/10 text-success',
			visibility === 'paused' && 'bg-muted text-muted-foreground'
		)}
		role="status"
	>
		{#if visibility === 'hidden'}
			<span class="icon-[lucide--eye-off] size-5 shrink-0" aria-hidden="true"></span>
			{m['MyAccommodationPage.MyAccommodationTabBillingSummary.hidden']()}
		{:else if visibility === 'visible'}
			<span class="icon-[lucide--eye] size-5 shrink-0" aria-hidden="true"></span>
			{m['MyAccommodationPage.MyAccommodationTabBillingSummary.visible']()}
		{:else}
			<span class="icon-[lucide--pause] size-5 shrink-0" aria-hidden="true"></span>
			{m['MyAccommodationPage.MyAccommodationTabBillingSummary.paused']()}
		{/if}
	</div>

	<!-- Plan panel -->
	<Card.Root class="bg-header text-header-foreground">
		<Card.Content>
			<div class="flex flex-wrap items-start justify-between gap-4">
				<div class="flex flex-col gap-1">
					<p class="text-sm text-header-foreground/70">
						{m['MyAccommodationPage.MyAccommodationTabBillingSummary.currentPlan']()}
					</p>
					<p class="text-lg font-semibold">{planName}</p>
				</div>
				<AccommodationBillingStatusBadge status={isExpired ? 'expired' : data.billingStatus} />
			</div>

			<p class="mt-8 text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
				{#if data.billingTerms.model === 'flat_fee'}
					{m['MyAccommodationPage.MyAccommodationTabBillingSummary.flatPrice']({
						amount: new Intl.NumberFormat(getLocale(), {
							style: 'currency',
							currency: data.billingTerms.currency
						}).format(data.billingTerms.amountMinor / 100),
						months: data.billingTerms.intervalMonths
					})}
				{:else if data.billingTerms.model === 'free'}
					{m['MyAccommodationPage.MyAccommodationTabBillingSummary.noFees']()}
				{:else}
					{m['MyAccommodationPage.MyAccommodationTabBillingSummary.bookingRate']({
						percent: data.billingTerms.commissionBps / 100
					})}
				{/if}
			</p>

			{#if paidUntil || data.billingPlanId === 'free'}
				<p class="mt-6 border-t border-header-foreground/15 pt-5 text-sm text-header-foreground/80">
					{#if paidUntil}
						{data.billingPlanId === 'free'
							? m['MyAccommodationPage.MyAccommodationTabBillingSummary.freeUntil']({
									date: paidUntil
								})
							: m['MyAccommodationPage.MyAccommodationTabBillingSummary.paidUntil']({
									date: paidUntil
								})}
					{:else}
						{m['MyAccommodationPage.MyAccommodationTabBillingSummary.freeForever']()}
					{/if}
				</p>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
