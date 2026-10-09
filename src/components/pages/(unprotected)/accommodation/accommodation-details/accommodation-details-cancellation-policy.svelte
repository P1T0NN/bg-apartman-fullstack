<script lang="ts">
	// COMPONENTS
	import AccommodationDetailsCancellationPolicyItem from './accommodation-details-cancellation-policy-item.svelte';

	// UTILS
	import { m } from '@/lib/paraglide/messages';
	import { cn } from '@/utils/utils.js';
	import { displayCancellationPolicyPeriods } from '@/shared/features/accommodations/utils/displayCancellationPolicyPeriods.js';

	// TYPES
	import type { PublicAccommodation } from '@/shared/features/accommodations/types/accommodationTypes.js';

	let { accommodation }: { accommodation: PublicAccommodation } = $props();

	const periods = $derived(displayCancellationPolicyPeriods(accommodation.cancellationPolicy));
	const fullRefund = $derived(periods.length === 1);
	const preset = $derived(
		accommodation.cancellationPolicy.mode === 'flexible' ||
			accommodation.cancellationPolicy.mode === 'moderate' ||
			accommodation.cancellationPolicy.mode === 'firm'
			? accommodation.cancellationPolicy.mode
			: null
	);
</script>

<section id="cancellation-policy" class="scroll-mt-32 py-9" aria-labelledby="cancellation-title">
	<h2 id="cancellation-title" class="mb-6 text-2xl font-semibold tracking-tight">
		{m['BookingsFeature.BookingCancellationPolicy.title']()}
	</h2>

	<div
		class={cn(
			'flex items-start gap-4 rounded-xl border p-5',
			fullRefund ? 'border-primary/30 bg-primary/5' : 'bg-muted/50'
		)}
	>
		<span
			class={cn(
				'mt-0.5 size-6 shrink-0',
				fullRefund
					? 'icon-[lucide--circle-check] text-primary'
					: 'icon-[lucide--shield-check] text-muted-foreground'
			)}
			aria-hidden="true"
		></span>
		<div>
			<h3 class="text-lg font-semibold tracking-tight">
				{preset
					? m[`CancellationPolicies.${preset}`]()
					: fullRefund
						? m['AccommodationPage.CancellationPolicy.fullTitle']()
						: m['AccommodationPage.CancellationPolicy.customTitle']()}
			</h3>
			<p class="mt-1 max-w-prose text-sm leading-6 text-muted-foreground">
				{preset
					? m[`CancellationPolicies.${preset}Description`]()
					: fullRefund
						? m['AccommodationPage.CancellationPolicy.fullHint']()
						: m['AccommodationPage.CancellationPolicy.customHint']()}
			</p>
		</div>
	</div>
	{#if preset}
		<p class="mt-3 text-sm text-muted-foreground">
			{m['CancellationPolicies.inclusiveDeadline']()}
		</p>
	{/if}

	{#if !fullRefund}
		<div class="mt-4 overflow-hidden rounded-xl border">
			<div
				class="hidden items-center justify-between gap-4 border-b bg-muted/50 px-5 py-3 text-xs font-medium text-muted-foreground sm:flex"
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

	<ul class="mt-6 flex flex-col gap-3 text-sm leading-6 text-muted-foreground">
		<li class="flex items-start gap-3">
			<span class="mt-1 icon-[lucide--info] size-4 shrink-0" aria-hidden="true"></span>
			{m['AccommodationPage.CancellationPolicy.beforeArrival']()}
		</li>
		<li class="flex items-start gap-3">
			<span class="mt-1 icon-[lucide--clock-3] size-4 shrink-0" aria-hidden="true"></span>
			<span>
				{m['BookingsFeature.BookingCancellationPolicy.policyTime']({
					timeZone: accommodation.timeZone
				})}
				{#if !fullRefund}{m['BookingsFeature.BookingCancellationPolicy.elapsedHours']()}{/if}
			</span>
		</li>
		<li class="flex items-start gap-3">
			<span class="mt-1 icon-[lucide--credit-card] size-4 shrink-0" aria-hidden="true"></span>
			{m['AccommodationPage.CancellationPolicy.noPayment']()}
		</li>
	</ul>
</section>
