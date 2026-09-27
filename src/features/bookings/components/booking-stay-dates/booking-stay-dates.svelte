<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime';

	// COMPONENTS
	import RangeCalendar from '@/components/ui/range-calendar/range-calendar.svelte';

	// HOOKS
	import { IsMobile } from '@/hooks/is-mobile.svelte.js';

	// UTILS
	import { formatDate } from '@/shared/utils/date.js';
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { DateRange } from 'bits-ui';
	import type { CalendarDate } from '@internationalized/date';

	let {
		value,
		minValue,
		onValueChange
	}: {
		value: DateRange | undefined;
		minValue?: CalendarDate;
		onValueChange: (range: DateRange) => void;
	} = $props();

	const isMobile = new IsMobile();

	const selected = $derived.by(() => ({
		checkIn: value?.start ? formatDate(value.start.toDate('UTC').getTime(), getLocale()) : '',
		checkOut: value?.end ? formatDate(value.end.toDate('UTC').getTime(), getLocale()) : ''
	}));
</script>

<div class="grid gap-3 sm:grid-cols-2">
	<div class="rounded-lg border px-3 py-2">
		<p class="text-xs text-muted-foreground">{m['BookingsFeature.BookingStayDates.checkIn']()}</p>
		<p class={cn('text-sm font-medium', !selected.checkIn && 'font-normal text-muted-foreground')}>
			{selected.checkIn || m['BookingsFeature.BookingStayDates.selectDates']()}
		</p>
	</div>

	<div class="rounded-lg border px-3 py-2">
		<p class="text-xs text-muted-foreground">{m['BookingsFeature.BookingStayDates.checkOut']()}</p>
		<p class={cn('text-sm font-medium', !selected.checkOut && 'font-normal text-muted-foreground')}>
			{selected.checkOut || m['BookingsFeature.BookingStayDates.selectDates']()}
		</p>
	</div>
</div>

<RangeCalendar
	class="mt-3 rounded-xl border"
	{value}
	{onValueChange}
	locale={getLocale()}
	{minValue}
	numberOfMonths={isMobile.current ? 1 : 2}
	fixedWeeks
	aria-label={m['BookingsFeature.BookingStayDates.stayDates']()}
/>
