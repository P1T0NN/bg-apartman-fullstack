<script lang="ts">
	// SVELTEKIT IMPORTS
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';

	// LIBRARIES
	import { getLocalTimeZone, today } from '@internationalized/date';

	// CONVEX
	import { api } from '@convex/_generated/api';

	// CONSTANTS
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// COMPONENTS
	import * as Field from '@/components/ui/field/index.js';
	import Form from '@/components/ui/custom-components/form/form.svelte';
	import BookingSummary from '../booking-summary/booking-summary.svelte';
	import BookingCheckoutConfirmButton from './booking-checkout-confirm-button.svelte';

	// FEATURES
	import BookingStayDates from '@/features/bookings/components/booking-stay-dates/booking-stay-dates.svelte';
	import { createBookingFormFields } from '@/features/bookings/forms/createBookingForm.js';

	// HOOKS
	import { useSearchParams } from '@/hooks/useSearchParams.svelte.js';

	// UTILS
	import { m } from '@/lib/paraglide/messages';
	import { parseIsoDate, toIsoDate } from '@/shared/utils/date.js';
	import { createBookingSchema } from '@/shared/features/bookings/schemas/bookingSchemas.js';

	// TYPES
	import type { PublicAccommodation } from '@/shared/features/accommodations/types/accommodationTypes.js';
	import type {
		CustomFieldContext,
		MutationValues
	} from '@/components/ui/custom-components/form/formTypes.js';

	let { accommodation }: { accommodation: PublicAccommodation } = $props();

	const createBooking = api.tables.bookings.mutations.createBooking.createBooking;
	const params = useSearchParams();

	let values = $state<MutationValues<typeof createBooking>>({
		checkInDate: params.read('checkIn'),
		checkOutDate: params.read('checkOut'),
		adults: Number(params.read('adults') || 1),
		children: Number(params.read('children') || 0),
		firstName: '',
		lastName: '',
		email: page.data.currentUser?.email ?? '',
		phone: '',
		specialRequests: ''
	});
	let submitting = $state(false);
	let currentDate = $state('');

	onMount(() => {
		currentDate = today(getLocalTimeZone()).toString();
	});

	const checkInDate = $derived(values.checkInDate == null ? '' : String(values.checkInDate));
	const checkOutDate = $derived(values.checkOutDate == null ? '' : String(values.checkOutDate));
	const bookingSchema = $derived(
		createBookingSchema({
			today: currentDate,
			minimumStay: accommodation.minimumStay,
			maximumStay: accommodation.maximumStay,
			maxGuests: accommodation.maxGuests
		})
	);

	const fields = $derived(
		createBookingFormFields({
			accommodation,
			render: { tripHeading, stayDates, tripLimits, guestHeading }
		})
	);
</script>

{#snippet tripHeading()}
	<h2 class="flex items-center gap-3 text-xl font-semibold">
		<span
			class="flex size-8 items-center justify-center rounded-full bg-muted text-sm"
			aria-hidden="true">1</span
		>{m['BookingPage.BookingCheckout.trip']()}
	</h2>
	<p class="mt-3 text-sm text-muted-foreground">{m['BookingPage.BookingCheckout.tripHint']()}</p>
{/snippet}

{#snippet stayDates(context: CustomFieldContext)}
	<BookingStayDates
		value={{ start: parseIsoDate(checkInDate), end: parseIsoDate(checkOutDate) }}
		minValue={parseIsoDate(currentDate)}
		onValueChange={(range) => {
			context.setValue('checkInDate', range.start ? toIsoDate(range.start) : '');
			context.setValue('checkOutDate', range.end ? toIsoDate(range.end) : '');
		}}
	/>
	<Field.Description class="mt-2">
		{m['BookingPage.BookingCheckout.checkOutTime']({ time: accommodation.checkOut })}
	</Field.Description>
{/snippet}

{#snippet tripLimits()}
	<p class="text-xs leading-5 text-muted-foreground">
		{m['BookingPage.BookingCheckout.limits']({
			minimum: accommodation.minimumStay,
			guests: accommodation.maxGuests
		})}
	</p>
{/snippet}

{#snippet guestHeading()}
	<h2 class="flex items-center gap-3 text-xl font-semibold">
		<span
			class="flex size-8 items-center justify-center rounded-full bg-muted text-sm"
			aria-hidden="true">2</span
		>{m['BookingPage.BookingCheckout.guestDetails']()}
	</h2>
	<p class="mt-3 text-sm text-muted-foreground">{m['BookingPage.BookingCheckout.guestHint']()}</p>
{/snippet}

<div class="grid grid-cols-1 items-start gap-9 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-16">
	<div class="min-w-0 lg:sticky lg:top-24 lg:col-start-2 lg:row-start-1">
		<BookingSummary
			{accommodation}
			{checkInDate}
			{checkOutDate}
			guests={Number(values.adults) + Number(values.children)}
		/>
	</div>

	<Form
		function={createBooking}
		schema={bookingSchema}
		{fields}
		extraFields={{ accommodationId: accommodation._id }}
		bind:values
		bind:submitting
		onSuccess={(bookingId) => goto(UNPROTECTED_PAGE_ENDPOINTS.BOOK_CONFIRMATION(bookingId))}
		successMessage={m['BookingPage.BookingCheckout.booked']()}
		class="min-w-0 lg:col-start-1 lg:row-start-1"
	>
		{#snippet customFields()}
			<div class="border-t pt-8">
				<div class="flex flex-col gap-4 text-sm leading-6">
					<p>
						<span class="font-medium">{m['BookingPage.BookingCheckout.cancellation']()}</span>
						{m['BookingPage.BookingCheckout.cancellationHint']()}
					</p>
					<p>
						<span class="font-medium">{m['BookingPage.BookingCheckout.payment']()}</span>
						{m['BookingPage.BookingCheckout.paymentHint']()}
					</p>
				</div>

				<BookingCheckoutConfirmButton {submitting} />
			</div>
		{/snippet}
	</Form>
</div>
