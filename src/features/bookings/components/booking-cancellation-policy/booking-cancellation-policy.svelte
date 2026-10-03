<script lang="ts">
	// SVELTEKIT IMPORTS
	import { onMount } from 'svelte';

	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime.js';

	// COMPONENTS
	import BookingCancellationPolicyItem from './booking-cancellation-policy-item.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';
	import { DAY_IN_MS } from '@/shared/utils/date.js';
	import { formatZonedDateTime } from '@/shared/features/timezone/utils/formatZonedDateTime.js';
	import { checkBookingCancellationRefund } from '@/shared/features/bookings/utils/checkBookingCancellationRefund.js';
	import { displayCancellationPolicyPeriods } from '@/shared/features/accommodations/utils/displayCancellationPolicyPeriods.js';

	// TYPES
	import type { CancellationPolicy } from '@/shared/features/accommodations/types/cancellationPolicyTypes.js';
	import type { BookingStatus } from '@/shared/features/bookings/schemas/bookingSchemas.js';

	let {
		policy,
		timeZone,
		checkInAt,
		booked = false,
		status,
		compact = false,
		timeline = false,
		invalidDate = false
	}: {
		policy: CancellationPolicy;
		timeZone: string;
		checkInAt?: number;
		booked?: boolean;
		status?: BookingStatus;
		compact?: boolean;
		timeline?: boolean;
		invalidDate?: boolean;
	} = $props();

	const uid = $props.id();

	let now = $state<number>();

	const periods = $derived(displayCancellationPolicyPeriods(policy));

	const active = $derived(status === undefined || status === 'pending' || status === 'confirmed');

	const currentRefund = $derived(
		checkInAt !== undefined && now !== undefined && active
			? checkBookingCancellationRefund({ policy, checkInAt }, now)
			: null
	);

	const currentPeriod = $derived(periods.find((period) => period.percentage === currentRefund));

	const currentDeadline = $derived(
		checkInAt !== undefined && currentPeriod
			? checkInAt - (currentPeriod.untilHours * DAY_IN_MS) / 24
			: undefined
	);

	onMount(() => {
		const refresh = () => {
			now = Date.now();
		};

		refresh();

		const timer = setInterval(refresh, 1000);

		document.addEventListener('visibilitychange', refresh);

		return () => {
			clearInterval(timer);
			document.removeEventListener('visibilitychange', refresh);
		};
	});
</script>

<section
	aria-labelledby={`${uid}-title`}
	class={cn(
		'flex min-w-0 flex-col gap-3 text-sm leading-6 wrap-anywhere',
		timeline && !compact && 'gap-4'
	)}
>
	<h3
		id={`${uid}-title`}
		class={cn('text-base font-semibold', timeline && !compact && 'flex items-center gap-3 text-xl')}
	>
		{#if timeline && !compact}
			<span
				class="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted"
				aria-hidden="true"
			>
				<span class="icon-[lucide--calendar-clock] size-5"></span>
			</span>
		{/if}
		{m['BookingsFeature.BookingCancellationPolicy.title']()}
	</h3>

	{#if booked}
		<p class="text-xs text-muted-foreground">
			{m['BookingsFeature.BookingCancellationPolicy.recordedTerms']()}
		</p>
	{/if}

	{#if invalidDate}
		<p role="status">
			{m['BookingsFeature.BookingCancellationPolicy.invalidDate']()}
		</p>
	{:else if checkInAt !== undefined && now !== undefined && now >= checkInAt && active}
		<p class="font-medium">
			{m['BookingsFeature.BookingCancellationPolicy.checkInPassed']()}
		</p>
	{:else if currentRefund !== null}
		<p class="font-medium" aria-live="polite">
			{m['BookingsFeature.BookingCancellationPolicy.cancelNow']({
				refund: m[`BookingsFeature.BookingCancellationPolicy.refund${currentRefund}`]()
			})}
		</p>
	{:else}
		<p class="font-medium">
			{periods.length === 1
				? m['BookingsFeature.BookingCancellationPolicy.fullRefund']()
				: m['BookingsFeature.BookingCancellationPolicy.customRefund']()}
		</p>
	{/if}

	{#if compact && currentDeadline !== undefined && currentPeriod}
		<p class="text-muted-foreground">
			{currentPeriod.untilHours === 0
				? m['BookingsFeature.BookingCancellationPolicyItem.beforeCheckIn']({
						date: formatZonedDateTime(currentDeadline, getLocale(), timeZone)
					})
				: m['BookingsFeature.BookingCancellationPolicyItem.until']({
						date: formatZonedDateTime(currentDeadline, getLocale(), timeZone)
					})}
		</p>

		<p class={cn('text-xs text-muted-foreground', timeline && 'flex items-center gap-2')}>
			{#if timeline}
				<span class="icon-[lucide--clock-3] size-4 shrink-0" aria-hidden="true"></span>
			{/if}
			{m['BookingsFeature.BookingCancellationPolicy.propertyTime']({ timeZone })}
		</p>
	{/if}

	{#if !timeline || compact}
		<p class="text-muted-foreground">
			{booked
				? m['BookingsFeature.BookingCancellationPolicy.noPaymentCollected']()
				: m['BookingsFeature.BookingCancellationPolicy.noPaymentRequired']()}
		</p>
	{/if}

	{#if !compact}
		<p class={cn('text-xs text-muted-foreground', timeline && 'flex items-center gap-2')}>
			{#if timeline}
				<span class="icon-[lucide--clock-3] size-4 shrink-0" aria-hidden="true"></span>
			{/if}
			{m['BookingsFeature.BookingCancellationPolicy.propertyTime']({ timeZone })}
		</p>

		{#if checkInAt === undefined && !invalidDate}
			<p class="text-muted-foreground">
				{m['BookingsFeature.BookingCancellationPolicy.selectDates']()}
			</p>
		{/if}

		<ul class={cn('divide-y border-y', timeline && 'ml-2 divide-y-0 border-y-0 pt-2')}>
			{#each periods as period (period.untilHours)}
				<BookingCancellationPolicyItem
					{period}
					{checkInAt}
					{timeZone}
					{timeline}
					current={currentRefund === period.percentage}
					now={active ? now : undefined}
				/>
			{/each}
		</ul>

		<p class="text-xs text-muted-foreground">
			{m['BookingsFeature.BookingCancellationPolicy.beforeCheckInOnly']()}
		</p>

		{#if checkInAt === undefined}
			<p class="text-xs text-muted-foreground">
				{m['BookingsFeature.BookingCancellationPolicy.elapsedHours']()}
			</p>
		{/if}
	{/if}

	{#if timeline && !compact}
		<div class="flex items-center gap-3 rounded-lg bg-muted/50 p-4 text-xs text-muted-foreground">
			<span class="icon-[lucide--info] size-4 shrink-0" aria-hidden="true"></span>
			<p class="text-muted-foreground">
				{booked
					? m['BookingsFeature.BookingCancellationPolicy.noPaymentCollected']()
					: m['BookingsFeature.BookingCancellationPolicy.noPaymentRequired']()}
			</p>
		</div>
	{/if}
</section>
