<script lang="ts">
	// COMPONENTS
	import BookingStayDatesCalendar from './booking-stay-dates-calendar.svelte';
	import BookingStayDatesHeader from './booking-stay-dates-header.svelte';
	import BookingStayDatesLegend from './booking-stay-dates-legend.svelte';
	import * as Field from '@/components/ui/field/index.js';

	// TYPES
	import type { DateRange } from 'bits-ui';
	import type { CalendarDate } from '@internationalized/date';
	import type { PublicAccommodation } from '@/shared/features/accommodations/types/accommodationTypes.js';

	let {
		accommodation,
		availabilityLoading,
		value,
		minValue,
		disabled = false,
		error,
		onValueChange
	}: {
		accommodation: PublicAccommodation;
		availabilityLoading: boolean;
		value: DateRange | undefined;
		minValue?: CalendarDate;
		disabled?: boolean;
		error?: string;
		onValueChange: (range: DateRange) => void;
	} = $props();

	const id = $props.id();

	const availability = $derived(availabilityLoading ? undefined : accommodation.availability);
</script>

<div
	tabindex="-1"
	aria-invalid={Boolean(error)}
	aria-describedby={error ? `${id}-stay-error` : undefined}
>
	<BookingStayDatesHeader {value} checkOutTime={accommodation.checkOut} />

	<BookingStayDatesCalendar
		pricing={accommodation}
		{availability}
		{availabilityLoading}
		{value}
		{minValue}
		{disabled}
		{error}
		errorId={`${id}-stay-error`}
		{onValueChange}
	/>

	{#if error}
		<Field.Error id={`${id}-stay-error`} class="mt-2">{error}</Field.Error>
	{/if}

	<BookingStayDatesLegend {accommodation} />
</div>
