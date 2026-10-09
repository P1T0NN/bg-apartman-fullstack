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
	import { getNightlyPricing } from '@/shared/features/bookings/utils/calculateStayPricing.js';
	import { formatCurrency } from '@/shared/utils/currency.js';
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { NightlyPricing } from '@/shared/features/loyalty/types/loyaltyTypes.js';
	import type { DateRange } from 'bits-ui';
	import type { CalendarDate, DateValue } from '@internationalized/date';
	import type { PublicAccommodation } from '@/shared/features/accommodations/types/accommodationTypes.js';

	let {
		availability,
		pricing,
		availabilityLoading,
		value,
		minValue,
		disabled = false,
		error,
		errorId,
		onValueChange
	}: {
		availability: PublicAccommodation['availability'] | undefined;
		pricing: NightlyPricing;
		availabilityLoading: boolean;
		value: DateRange | undefined;
		minValue?: CalendarDate;
		disabled?: boolean;
		error?: string;
		errorId: string;
		onValueChange: (range: DateRange) => void;
	} = $props();

	const isMobile = new IsMobile();

	const CALENDAR_CHROME = 26; // calendar padding (p-3) + border
	const MONTH_GAP = 16; // gap between side-by-side months
	const CELL_MIN = 32;
	const CELL_MAX = 48;
	const TWO_MONTH_MIN_WIDTH = 602; // keeps two-month cells at 40px or wider

	let containerWidth = $state(0);

	function trackWidth(node: HTMLElement) {
		containerWidth = node.clientWidth;
		const observer = new ResizeObserver(() => (containerWidth = node.clientWidth));
		observer.observe(node);
		return () => observer.disconnect();
	}

	// Two months only when the container can hold them with readable cells and the
	// shared Months wrapper lays months side by side (md and up).
	const monthCount = $derived(containerWidth >= TWO_MONTH_MIN_WIDTH && !isMobile.current ? 2 : 1);
	const cellSize = $derived.by(() => {
		const inner = containerWidth - CALENDAR_CHROME - (monthCount === 2 ? MONTH_GAP : 0);
		return Math.min(CELL_MAX, Math.max(CELL_MIN, inner / (monthCount * 7)));
	});

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

<div class="min-w-0" {@attach trackWidth}>
	<RangeCalendar
		{isDateDisabled}
		disableDaysOutsideMonth
		style={`--cell-size:${cellSize}px`}
		class={cn('mx-auto mt-3 w-fit max-w-full rounded-xl border', error && 'border-destructive')}
		{value}
		{disabled}
		onValueChange={(range) => {
			const equalDates = range.start && range.end && range.start.compare(range.end) === 0;
			onValueChange(equalDates ? { start: range.start, end: undefined } : range);
		}}
		locale={getLocale()}
		{minValue}
		numberOfMonths={monthCount}
		fixedWeeks
		aria-label={m['BookingsFeature.BookingStayDatesCalendar.stayDates']()}
		aria-invalid={Boolean(error)}
		aria-busy={availabilityLoading}
		aria-describedby={error ? errorId : undefined}
	>
		{#snippet day({ day, outsideMonth })}
			{#if !outsideMonth}
				<Day
					class={cn(
						'[&[data-today]:not([data-selected]):not([data-disabled])]:ring-1 [&[data-today]:not([data-selected]):not([data-disabled])]:ring-foreground',
						'flex flex-col gap-0.5',
						isNightUnavailable(day) &&
							'rounded-sm! border border-destructive bg-destructive/15! text-destructive! line-through data-disabled:opacity-100!'
					)}
				>
					<span>{day.day}</span>
					{#if !isNightUnavailable(day)}<span
							class="hidden max-w-full truncate text-[9px]! font-normal tabular-nums opacity-100! md:inline"
							title={formatCurrency(
								getNightlyPricing(pricing, day.toString()).effectivePricePerNightMinor,
								getLocale()
							)}
						>
							{formatCurrency(
								getNightlyPricing(pricing, day.toString()).effectivePricePerNightMinor,
								getLocale()
							)}
						</span>{/if}
					{#if isNightUnavailable(day)}
						<span class="sr-only">
							{m['BookingsFeature.BookingStayDatesCalendar.unavailable']()}
						</span>
					{/if}
				</Day>
			{/if}
		{/snippet}
	</RangeCalendar>
</div>
