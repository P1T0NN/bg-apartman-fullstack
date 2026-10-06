<script lang="ts">
	import { m } from '@/lib/paraglide/messages';
	import type { CancellationPolicyPeriod } from '@/shared/features/accommodations/types/cancellationPolicyTypes.js';
	let { period }: { period: CancellationPolicyPeriod } = $props();
</script>

<li class="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
	<p class="text-sm leading-6">
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
	</p>
	<p class="w-fit shrink-0 rounded-md bg-muted px-3 py-1 text-sm font-medium tabular-nums">
		{m[`BookingsFeature.BookingCancellationPolicy.refund${period.percentage}`]()}
	</p>
</li>
