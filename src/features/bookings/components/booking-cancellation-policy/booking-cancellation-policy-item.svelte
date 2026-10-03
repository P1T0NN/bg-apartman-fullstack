<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime.js';

	// UTILS
	import { cn } from '@/utils/utils.js';
	import { formatZonedDateTime } from '@/shared/features/timezone/utils/formatZonedDateTime.js';
	import { DAY_IN_MS } from '@/shared/utils/date.js';

	// TYPES
	import type { CancellationPolicyPeriod } from '@/shared/features/accommodations/types/cancellationPolicyTypes.js';

	let {
		period,
		checkInAt,
		timeZone,
		current = false,
		timeline = false,
		now
	}: {
		period: CancellationPolicyPeriod;
		checkInAt?: number;
		timeZone: string;
		current?: boolean;
		timeline?: boolean;
		now?: number;
	} = $props();

	const end = $derived(
		checkInAt === undefined ? undefined : checkInAt - (period.untilHours * DAY_IN_MS) / 24
	);

	const start = $derived(
		checkInAt === undefined || period.afterHours === null
			? undefined
			: checkInAt - (period.afterHours * DAY_IN_MS) / 24
	);

	const expired = $derived(
		end !== undefined && now !== undefined && (period.untilHours === 0 ? now >= end : now > end)
	);
</script>

<li
	class={cn(
		'flex flex-col gap-1 py-3',
		timeline &&
			'relative pt-0 pb-6 pl-6 before:absolute before:top-7 before:-bottom-7 before:left-0 before:border-l-2 before:border-border last:pb-0 last:before:hidden'
	)}
>
	{#if timeline}
		<span
			aria-hidden="true"
			class={cn(
				'absolute top-5 -left-[7px] size-4 rounded-full border-2 border-background bg-muted-foreground',
				current && 'bg-primary ring-4 ring-primary/10',
				expired && 'bg-border'
			)}
		></span>
	{/if}
	<div
		class={cn(
			'flex min-w-0 flex-col gap-1',
			timeline && 'gap-3 rounded-xl border p-4 sm:p-5',
			timeline && current && 'border-primary/30 bg-primary/5'
		)}
	>
		{#if timeline}
			<p
				aria-hidden="true"
				class={cn(
					'text-3xl font-semibold tracking-tight tabular-nums',
					expired && 'text-muted-foreground'
				)}
			>
				{period.percentage}
				<span class="ml-0.5 text-lg">%</span>
			</p>
		{/if}
		<div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
			<p class="font-medium">
				{m[`BookingsFeature.BookingCancellationPolicy.refund${period.percentage}`]()}
			</p>

			{#if current}
				<span
					class={cn(
						'text-xs text-muted-foreground',
						timeline && 'rounded-full bg-primary px-2.5 py-0.5 font-medium text-primary-foreground'
					)}
				>
					{m['BookingsFeature.BookingCancellationPolicyItem.appliesNow']()}
				</span>
			{/if}

			{#if expired}
				<span class="text-xs text-muted-foreground">
					{m['BookingsFeature.BookingCancellationPolicyItem.passed']()}
				</span>
			{/if}
		</div>

		<div class="flex flex-col gap-1 text-sm text-muted-foreground">
			{#if start !== undefined}
				<p>
					{m['BookingsFeature.BookingCancellationPolicyItem.after']({
						date: formatZonedDateTime(start, getLocale(), timeZone)
					})}
				</p>
			{/if}

			{#if end !== undefined}
				<p>
					{period.untilHours === 0
						? m['BookingsFeature.BookingCancellationPolicyItem.beforeCheckIn']({
								date: formatZonedDateTime(end, getLocale(), timeZone)
							})
						: m['BookingsFeature.BookingCancellationPolicyItem.until']({
								date: formatZonedDateTime(end, getLocale(), timeZone)
							})}
				</p>
			{:else}
				<p>
					{#if period.untilHours === 0}
						{period.afterHours === null
							? m['BookingsFeature.BookingCancellationPolicyItem.beforeCheckInUndated']()
							: m['BookingsFeature.BookingCancellationPolicyItem.afterBeforeCheckIn']()}
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
			{/if}
		</div>
	</div>
</li>
