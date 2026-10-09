<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime';

	// COMPONENTS
	import * as RangeCalendar from '@/components/ui/range-calendar/index.js';
	import MyAccommodationCalendarDayItem from './my-accommodation-calendar-day-item/my-accommodation-calendar-day-item.svelte';

	// UTILS
	import { formatMonth } from '@/shared/utils/date.js';

	// TYPES
	import type { NightlyPricing } from '@/shared/features/loyalty/types/loyaltyTypes.js';
	import type { Month } from 'bits-ui';
	import type { DateValue } from '@internationalized/date';

	let {
		month,
		weekdays,
		bookings,
		blockedDates,
		availabilityLoaded,
		pricing
	}: {
		month: Month<DateValue>;
		weekdays: string[];
		bookings: { checkInDate: string; checkOutDate: string }[];
		blockedDates: string[];
		availabilityLoaded: boolean;
		pricing?: NightlyPricing;
	} = $props();
</script>

<RangeCalendar.Grid class="mt-0 table w-full table-fixed border-collapse">
	<caption class="sr-only">
		{m['MyAccommodationPage.MyAccommodationCalendarMonth.caption']({
			month: formatMonth(month.value.toDate('UTC').getTime(), getLocale())
		})}
	</caption>

	<RangeCalendar.GridHead>
		<RangeCalendar.GridRow class="table-row">
			{#each weekdays as weekday (weekday)}
				<RangeCalendar.HeadCell
					class="w-auto rounded-none border-b bg-muted/30 py-3 text-xs font-medium"
				>
					{weekday}
				</RangeCalendar.HeadCell>
			{/each}
		</RangeCalendar.GridRow>
	</RangeCalendar.GridHead>

	<RangeCalendar.GridBody>
		{#each month.weeks as week (week[0].toString())}
			<RangeCalendar.GridRow class="table-row">
				{#each week as date (date.toString())}
					<MyAccommodationCalendarDayItem
						{date}
						month={month.value}
						{bookings}
						{blockedDates}
						{availabilityLoaded}
						{pricing}
					/>
				{/each}
			</RangeCalendar.GridRow>
		{/each}
	</RangeCalendar.GridBody>
</RangeCalendar.Grid>
