<script lang="ts">
	import { m } from '@/lib/paraglide/messages';
	import AccommodationDetailsCancellationPolicyItem from './accommodation-details-cancellation-policy-item.svelte';
	import { displayCancellationPolicyPeriods } from '@/shared/features/accommodations/utils/displayCancellationPolicyPeriods.js';
	import type { PublicAccommodation } from '@/shared/features/accommodations/types/accommodationTypes.js';

	let { accommodation }: { accommodation: PublicAccommodation } = $props();
	const periods = $derived(displayCancellationPolicyPeriods(accommodation.cancellationPolicy));
	const fullRefund = $derived(periods.length === 1);
</script>

<section id="cancellation-policy" class="scroll-mt-24 py-9" aria-labelledby="cancellation-title">
	<h2 id="cancellation-title" class="mb-6 text-2xl font-semibold tracking-tight">
		{m['BookingsFeature.BookingCancellationPolicy.title']()}
	</h2>

	<div class="flex items-start gap-4 rounded-xl bg-muted/50 p-5 sm:p-6">
		<span
			class="mt-0.5 icon-[lucide--shield-check] size-6 shrink-0 text-muted-foreground"
			aria-hidden="true"
		></span>
		<div>
			<h3 class="text-lg font-semibold tracking-tight">
				{fullRefund
					? m['AccommodationPage.CancellationPolicy.fullTitle']()
					: m['AccommodationPage.CancellationPolicy.customTitle']()}
			</h3>
			<p class="mt-1 max-w-prose text-sm leading-6 text-muted-foreground">
				{fullRefund
					? m['AccommodationPage.CancellationPolicy.fullHint']()
					: m['AccommodationPage.CancellationPolicy.customHint']()}
			</p>
		</div>
	</div>

	{#if !fullRefund}
		<div class="mt-6">
			<div
				class="hidden grid-cols-[minmax(0,1fr)_auto] gap-4 border-b pb-3 text-xs font-medium text-muted-foreground sm:grid"
				aria-hidden="true"
			>
				<span>{m['AccommodationPage.CancellationPolicy.cancelWhen']()}</span>
				<span>{m['AccommodationPage.CancellationPolicy.refund']()}</span>
			</div>
			<ol class="divide-y">
				{#each periods as period (period.untilHours)}
					<AccommodationDetailsCancellationPolicyItem {period} />
				{/each}
			</ol>
		</div>
	{/if}

	<div class="mt-6 flex flex-col gap-3 text-sm leading-6 text-muted-foreground">
		<p>{m['AccommodationPage.CancellationPolicy.beforeArrival']()}</p>
		<p class="flex items-start gap-2 text-xs leading-5">
			<span class="mt-0.5 icon-[lucide--clock-3] size-4 shrink-0" aria-hidden="true"></span>
			<span>
				{m['BookingsFeature.BookingCancellationPolicy.policyTime']({
					timeZone: accommodation.timeZone
				})}
				{#if !fullRefund}{m['BookingsFeature.BookingCancellationPolicy.elapsedHours']()}{/if}
			</span>
		</p>
		<p class="border-t pt-4 text-xs leading-5">
			{m['AccommodationPage.CancellationPolicy.noPayment']()}
		</p>
	</div>
</section>
