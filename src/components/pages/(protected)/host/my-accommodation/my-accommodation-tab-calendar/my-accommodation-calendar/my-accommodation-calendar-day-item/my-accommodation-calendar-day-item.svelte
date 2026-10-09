<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	import { isEqualMonth } from '@internationalized/date';

	// COMPONENTS
	import MyAccommodationCalendarFreeDay from './my-accommodation-calendar-free-day.svelte';
	import * as RangeCalendar from '@/components/ui/range-calendar/index.js';
	import MyAccommodationCalendarBookedDay from './my-accommodation-calendar-booked-day.svelte';
	import MyAccommodationCalendarBlockedDay from './my-accommodation-calendar-blocked-day.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { NightlyPricing } from '@/shared/features/loyalty/types/loyaltyTypes.js';
	import type { DateValue } from '@internationalized/date';

	let {
		date,
		month,
		bookings,
		blockedDates,
		availabilityLoaded,
		pricing
	}: {
		date: DateValue;
		month: DateValue;
		bookings: { checkInDate: string; checkOutDate: string }[];
		blockedDates: string[];
		availabilityLoaded: boolean;
		pricing?: NightlyPricing;
	} = $props();

	const day = $derived(date.day);

	const outsideMonth = $derived(!isEqualMonth(date, month));

	const booked = $derived(
		bookings.some(
			(booking) => date.toString() >= booking.checkInDate && date.toString() < booking.checkOutDate
		)
	);
	const blocked = $derived(blockedDates.includes(date.toString()));
	const unavailableReason = $derived(
		booked ? m['MyAccommodationPage.MyAccommodationCalendarDayItem.bookedUnavailable']() : undefined
	);

	const status = $derived(
		!availabilityLoaded
			? m['MyAccommodationPage.MyAccommodationCalendarDayItem.unknown']()
			: booked
				? m['MyAccommodationPage.MyAccommodationCalendarDayItem.booked']()
				: blocked
					? m['MyAccommodationPage.MyAccommodationCalendarDayItem.blocked']()
					: m['MyAccommodationPage.MyAccommodationCalendarDayItem.available']()
	);
</script>

<RangeCalendar.Cell
	{date}
	{month}
	title={unavailableReason}
	class={cn(
		'h-24 w-auto rounded-none border-r border-b p-0 align-top last:border-r-0 has-data-range-middle:bg-primary/10! has-data-selected:rounded-none! has-data-selected:bg-primary/10! sm:h-28',
		booked && 'bg-muted/70',
		blocked &&
			!booked &&
			'bg-destructive/10 has-data-range-middle:bg-destructive/15! has-data-selected:bg-destructive/15!',
		outsideMonth && 'bg-muted/25'
	)}
>
	<RangeCalendar.Day
		class={cn(
			'group h-24 w-full items-stretch justify-between rounded-none p-1.5 whitespace-normal text-foreground focus-visible:ring-2 focus-visible:ring-inset data-range-end:bg-transparent! data-range-end:text-foreground! data-range-start:bg-transparent! data-range-start:text-foreground! sm:h-28 sm:p-2.5',
			outsideMonth && 'invisible',
			booked && 'data-disabled:opacity-100!',
			blocked && !booked && 'bg-transparent! not-data-selected:hover:bg-destructive/15!'
		)}
	>
		<div class="flex h-full flex-col justify-between gap-2 text-left">
			<span
				class={cn(
					'flex size-7 items-center justify-center rounded-full text-sm tabular-nums group-data-selected:bg-primary group-data-selected:text-primary-foreground'
				)}
			>
				{day}
				<span class="sr-only">: {status}</span>
			</span>

			{#if !availabilityLoaded}
				<span class="text-xs text-muted-foreground" aria-hidden="true">—</span>
			{:else if booked}
				<MyAccommodationCalendarBookedDay {booked} />
			{:else if blocked}
				<MyAccommodationCalendarBlockedDay />
			{:else if pricing}
				<MyAccommodationCalendarFreeDay {date} {pricing} />
			{/if}
		</div>
	</RangeCalendar.Day>
</RangeCalendar.Cell>
