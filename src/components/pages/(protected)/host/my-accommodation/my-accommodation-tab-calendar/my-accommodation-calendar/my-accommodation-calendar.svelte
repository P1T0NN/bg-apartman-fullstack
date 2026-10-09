<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime';

	// COMPONENTS
	import MyAccommodationCalendarHeader from './my-accommodation-calendar-header.svelte';
	import MyAccommodationCalendarMonth from './my-accommodation-calendar-month.svelte';
	import { RangeCalendar as RangeCalendarPrimitive, type DateRange } from 'bits-ui';

	// TYPES
	import type { NightlyPricing } from '@/shared/features/loyalty/types/loyaltyTypes.js';
	import type { DateValue } from '@internationalized/date';

	let {
		value = $bindable(),
		placeholder = $bindable(),
		minValue,
		bookings,
		blockedDates,
		availabilityLoaded,
		pricing,
		disabled = false
	}: {
		value: DateRange;
		placeholder: DateValue;
		minValue: DateValue;
		bookings: { checkInDate: string; checkOutDate: string }[];
		blockedDates: string[];
		availabilityLoaded: boolean;
		pricing?: NightlyPricing;
		disabled?: boolean;
	} = $props();

	function isDateDisabled(date: DateValue): boolean {
		const iso = date.toString();
		return (
			disabled ||
			bookings.some((booking) => iso >= booking.checkInDate && iso < booking.checkOutDate)
		);
	}
</script>

<RangeCalendarPrimitive.Root
	bind:value
	bind:placeholder
	{minValue}
	{isDateDisabled}
	excludeDisabled
	locale={getLocale()}
	weekStartsOn={1}
	weekdayFormat="short"
	calendarLabel={m['MyAccommodationPage.MyAccommodationCalendar.title']()}
	disableDaysOutsideMonth
	class="[--cell-size:2.5rem]"
>
	{#snippet children({ months, weekdays })}
		<MyAccommodationCalendarHeader bind:placeholder {minValue} />

		{#each months as month (month.value.toString())}
			<MyAccommodationCalendarMonth
				{month}
				{weekdays}
				{bookings}
				{blockedDates}
				{availabilityLoaded}
				{pricing}
			/>
		{/each}
	{/snippet}
</RangeCalendarPrimitive.Root>
