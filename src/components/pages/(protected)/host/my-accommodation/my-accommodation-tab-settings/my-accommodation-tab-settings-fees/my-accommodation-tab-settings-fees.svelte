<script lang="ts">
	// SVELTEKIT IMPORTS
	import { page } from '$app/state';

	// LIBRARIES
	import { m } from '@/lib/paraglide/messages.js';
	import { getLocale } from '@/lib/paraglide/runtime.js';

	// COMPONENTS
	import * as Card from '@/components/ui/card/index.js';
	import AccommodationFlatFeePaymentButton from '@/features/accommodations/components/accommodation-flat-fee-payment-button/accommodation-flat-fee-payment-button.svelte';
	import MyAccommodationTabSettingsFeesHeader from './my-accommodation-tab-settings-fees-header.svelte';
	import MyAccommodationTabSettingsFeesSwitchToFlatDialog from './my-accommodation-tab-settings-fees-switch-to-flat-dialog.svelte';
	import MyAccommodationTabSettingsFeesSwitchToBookingButton from './my-accommodation-tab-settings-fees-switch-to-booking-button.svelte';

	// HOOKS
	import { useClock } from '@/hooks/useClock.svelte.js';

	// TYPES
	import type { Id } from '@convex/_generated/dataModel.js';
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

	// SAFETY: Convex validates the route ID and checks accommodation ownership.
	const accommodationId = $derived(page.params.id as Id<'accommodations'>);

	const clock = useClock();

	const titleId = $props.id();

	const isFlatFee = $derived(data.billingPlanId === 'flat_fee');

	const isExpired = $derived(
		isFlatFee && data.billingPeriodEndsAt != null && data.billingPeriodEndsAt <= clock.now
	);
	const isLocked = $derived(isFlatFee && data.billingStatus === 'active' && !isExpired);

	const paidUntil = $derived(
		data.billingPeriodEndsAt == null
			? null
			: new Intl.DateTimeFormat(getLocale(), { dateStyle: 'medium', timeStyle: 'short' }).format(
					data.billingPeriodEndsAt
				)
	);

	let pending = $state(false);
</script>

<section aria-labelledby={titleId}>
	<Card.Root>
		<MyAccommodationTabSettingsFeesHeader id={titleId} />

		<Card.Content class="flex flex-col gap-5">
			<div class="flex flex-wrap items-start justify-between gap-3">
				<div class="flex flex-col gap-1">
					<p class="text-sm text-muted-foreground">
						{m['MyAccommodationPage.MyAccommodationTabSettingsFees.currentPlan']()}
					</p>

					<p class="font-medium">
						{data.billingPlanId === 'free'
							? m['MyAccommodationPage.MyAccommodationTabSettingsFees.free']()
							: isFlatFee
								? m['MyAccommodationPage.MyAccommodationTabSettingsFees.flatFee']()
								: m['MyAccommodationPage.MyAccommodationTabSettingsFees.bookingFee']()}
					</p>

					{#if data.billingTerms.model === 'flat_fee'}
						<p class="text-sm">
							{m['MyAccommodationPage.MyAccommodationTabSettingsFees.flatPrice']({
								amount: new Intl.NumberFormat(getLocale(), {
									style: 'currency',
									currency: data.billingTerms.currency
								}).format(data.billingTerms.amountMinor / 100),
								months: data.billingTerms.intervalMonths
							})}
						</p>
					{:else if data.billingTerms.model === 'free'}
						<p class="text-sm">
							{m['MyAccommodationPage.MyAccommodationTabSettingsFees.noFees']()}
						</p>
					{:else}
						<p class="text-sm">
							{m['MyAccommodationPage.MyAccommodationTabSettingsFees.bookingRate']({
								percent: data.billingTerms.commissionBps / 100
							})}
						</p>
					{/if}
				</div>
			</div>

			{#if data.billingPlanId === 'free'}
				<p class="text-sm">
					{paidUntil
						? m['MyAccommodationPage.MyAccommodationTabSettingsFees.freeUntil']({ date: paidUntil })
						: m['MyAccommodationPage.MyAccommodationTabSettingsFees.freeForever']()}
				</p>
			{/if}

			<div class="flex flex-wrap gap-3">
				{#if isFlatFee}
					{#if !isLocked}
						<AccommodationFlatFeePaymentButton {accommodationId} {isExpired} bind:pending />
					{/if}

					<MyAccommodationTabSettingsFeesSwitchToBookingButton
						{isLocked}
						status={data.status}
						bind:pending
					/>
				{:else if data.billingPlanId === 'booking_fee'}
					<MyAccommodationTabSettingsFeesSwitchToFlatDialog billingPlanId={data.billingPlanId} />
				{/if}
			</div>

			{#if isLocked}
				<p class="text-sm text-muted-foreground">
					{paidUntil
						? m['MyAccommodationPage.MyAccommodationTabSettingsFees.locked']({ date: paidUntil })
						: m['MyAccommodationPage.MyAccommodationTabSettingsFees.paidLocked']()}
				</p>
			{/if}
		</Card.Content>
	</Card.Root>
</section>
