<script lang="ts">
	// UTILS
	import { m } from '@/lib/paraglide/messages';
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { CancellationPolicyPeriod } from '@/shared/features/accommodations/types/cancellationPolicyTypes.js';

	let { period }: { period: CancellationPolicyPeriod } = $props();

	const percentage = $derived(Number(period.percentage));

	// Full refund, partial refund and no refund each get their own icon so the row reads at a glance.
	const statusIcon = $derived.by(() => {
		if (percentage === 100) return 'icon-[lucide--circle-check] text-primary';
		if (percentage === 0) return 'icon-[lucide--circle-x] text-destructive';
		return 'icon-[lucide--circle-minus] text-muted-foreground';
	});
</script>

<li class="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
	<p class="flex items-start gap-3 text-sm leading-6">
		<span class={cn(statusIcon, 'mt-0.5 size-5 shrink-0')} aria-hidden="true"></span>
		<span>
			{#if period.untilHours === 0}
				{m['BookingsFeature.BookingCancellationPolicyItem.afterBeforeCheckIn']()}
			{:else if period.untilHours === 24}
				{period.afterHours === null
					? m['BookingsFeature.BookingCancellationPolicyItem.until24Hours']()
					: m['BookingsFeature.BookingCancellationPolicyItem.afterUntil24Hours']()}
			{:else}
				{period.afterHours === null
					? m['BookingsFeature.BookingCancellationPolicyItem.untilDays']({
							days: period.untilHours / 24
						})
					: m['BookingsFeature.BookingCancellationPolicyItem.afterUntilDays']({
							days: period.untilHours / 24
						})}
			{/if}
		</span>
	</p>

	<p
		class={cn(
			'w-fit shrink-0 rounded-md px-3 py-1 text-sm font-medium tabular-nums sm:ml-auto',
			percentage === 100 ? 'bg-primary/10 text-primary' : 'bg-muted'
		)}
	>
		{m[`BookingsFeature.BookingCancellationPolicy.refund${period.percentage}`]()}
	</p>
</li>
