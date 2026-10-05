<script lang="ts">
	// COMPONENTS
	import AccommodationReservationRulesGuest from '@/features/accommodations/components/accommodation-reservation-rules-guest/accommodation-reservation-rules-guest.svelte';
	import BookingStayDatesCalendar from './booking-stay-dates-calendar.svelte';
	import BookingStayDatesHeader from './booking-stay-dates-header.svelte';
	import BookingStayDatesLegend from './booking-stay-dates-legend.svelte';
	import * as Field from '@/components/ui/field/index.js';

	// UTILS
	import { m } from '@/lib/paraglide/messages';

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
	<BookingStayDatesHeader {value} />

	<BookingStayDatesCalendar
		{availability}
		{availabilityLoading}
		{value}
		{minValue}
		{disabled}
		{error}
		{onValueChange}
	/>

	<BookingStayDatesLegend />

	{#if error}
		<Field.Error id={`${id}-stay-error`}>{error}</Field.Error>
	{/if}
	
	<Field.Description class="mt-2">
		{m['BookingPage.BookCheckoutForm.checkOutTime']({ time: accommodation.checkOut })}
	</Field.Description>

	<div class="mt-4">
		<AccommodationReservationRulesGuest {accommodation} />
	</div>
</div>
