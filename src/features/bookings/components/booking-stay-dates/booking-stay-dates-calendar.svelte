<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime';

	// COMPONENTS
	import RangeCalendar from '@/components/ui/range-calendar/range-calendar.svelte';
	import { Day } from '@/components/ui/range-calendar/index.js';

	// HOOKS
	import { IsMobile } from '@/hooks/is-mobile.svelte.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { DateRange } from 'bits-ui';
	import type { CalendarDate, DateValue } from '@internationalized/date';
	import type { PublicAccommodation } from '@/shared/features/accommodations/types/accommodationTypes.js';

	let {
		availability,
		availabilityLoading,
		value,
		minValue,
		disabled = false,
		error,
		onValueChange
	}: {
		availability: PublicAccommodation['availability'] | undefined;
		availabilityLoading: boolean;
		value: DateRange | undefined;
		minValue?: CalendarDate;
		disabled?: boolean;
		error?: string;
		onValueChange: (range: DateRange) => void;
	} = $props();

	const isMobile = new IsMobile();
	const id = $props.id();

	function isNightUnavailable(date: DateValue): boolean {
		const iso = date.toString();
		return Boolean(
			availability?.blockedDates.includes(iso) ||
			availability?.bookings.some(
				(booking) => iso >= booking.checkInDate && iso < booking.checkOutDate
			)
		);
	}

	function isDateDisabled(date: DateValue): boolean {
		if (availabilityLoading || !availability) return true;
		const start = value?.start;
		if (value?.end?.compare(date) === 0) return false;
		// The checkout date is not a reserved night, so checkout on an unavailable night is allowed.
		const choosingRange = start && !value?.end && date.compare(start) !== 0;
		if (choosingRange) {
			const first = date.compare(start) < 0 ? date.toString() : start.toString();
			const end = date.compare(start) < 0 ? start.toString() : date.toString();
			return Boolean(
				availability.blockedDates.some((night) => night >= first && night < end) ||
				availability.bookings.some(
					(booking) => booking.checkInDate < end && booking.checkOutDate > first
				)
			);
		}
		return isNightUnavailable(date);
	}
</script>

<RangeCalendar
	{isDateDisabled}
	disableDaysOutsideMonth
	class="mt-3 rounded-xl border [&_[data-today]:not([data-selected]):not([data-disabled])]:ring-1 [&_[data-today]:not([data-selected]):not([data-disabled])]:ring-foreground"
	{value}
	{disabled}
	onValueChange={(range) => {
		const equalDates = range.start && range.end && range.start.compare(range.end) === 0;
		onValueChange(equalDates ? { start: range.start, end: undefined } : range);
	}}
	locale={getLocale()}
	{minValue}
	numberOfMonths={isMobile.current ? 1 : 2}
	fixedWeeks
	aria-label={m['BookingsFeature.BookingStayDatesCalendar.stayDates']()}
	aria-invalid={Boolean(error)}
	aria-busy={availabilityLoading}
	aria-describedby={error ? `${id}-error` : undefined}
>
	{#snippet day({ day })}
		<Day
			class={cn(
				isNightUnavailable(day) &&
					'rounded-sm! border border-destructive bg-destructive/15! text-destructive! line-through data-disabled:opacity-100!'
			)}
		>
			{day.day}
			{#if isNightUnavailable(day)}
				<span class="sr-only">{m['BookingsFeature.BookingStayDatesCalendar.unavailable']()}</span>
			{/if}
		</Day>
	{/snippet}
</RangeCalendar>
