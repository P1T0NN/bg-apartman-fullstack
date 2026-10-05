<script lang="ts">
	// SVELTEKIT IMPORTS
	import { page } from '$app/state';
	import { resolve } from '$app/paths';

	// LIBRARIES
	import { api } from '@convex/_generated/api';
	import { useMutation } from 'convex-svelte';
	import { tick } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import BookSummary from '../book-summary/book-summary.svelte';
	import BookCheckoutForm from './book-checkout-form/book-checkout-form.svelte';

	// HOOKS
	import { useSearchParams } from '@/hooks/useSearchParams.svelte.js';
	import { useGuestLocal } from '@/features/guests/hooks/useGuestLocal.svelte.js';

	// UTILS
	import { timeZoneSchema } from '@/shared/features/timezone/schemas/timezoneSchemas.js';
	import { createBookingSchema } from '@/shared/features/bookings/schemas/bookingSchemas.js';
	import { getIsoDateInTimeZone } from '@/shared/features/timezone/utils/getIsoDateInTimeZone.js';
	import { formValidationErrors } from '@/components/ui/custom-components/form/formValues.js';
	import { focusFirstError } from '@/utils/focusFirstError.js';
	import { gotoParaglide } from '@/utils/gotoParaglide.js';
	import { toastMessage } from '@/utils/toastMessage.js';

	// TYPES
	import type { PublicAccommodation } from '@/shared/features/accommodations/types/accommodationTypes.js';
	import type { BookingCheckoutValues } from '@/shared/features/bookings/types/bookingTypes.js';
	import type { Id } from '@convex/_generated/dataModel';

	let {
		accommodation,
		availabilityLoading
	}: {
		accommodation: PublicAccommodation;
		availabilityLoading: boolean;
	} = $props();

	const createBooking = useMutation(api.tables.bookings.mutations.createBooking.createBooking);
	const params = useSearchParams();
	const guest = useGuestLocal();

	let checkout: HTMLDivElement;
	let createdBookingId: Id<'bookings'> | undefined;

	let values = $state<BookingCheckoutValues>({
		checkInDate: params.read('checkIn') ?? '',
		checkOutDate: params.read('checkOut') ?? '',
		adults: Number(params.read('adults') || 1),
		children: Number(params.read('children') || 0),
		firstName: '',
		lastName: '',
		email: page.data.currentUser?.email ?? '',
		phone: '',
		specialRequests: ''
	});
	let submitting = $state(false);
	let errors = $state<Record<string, string>>({});

	const checkInDate = $derived(values.checkInDate);
	const checkOutDate = $derived(values.checkOutDate);
	const timeZone = $derived(timeZoneSchema.safeParse(accommodation.timeZone));

	async function handleBookAccommodation(): Promise<void> {
		if (submitting || !timeZone.success) return;

		submitting = true;

		errors = {};

		try {
			if (!createdBookingId) {
				const now = Date.now();

				const schema = createBookingSchema({
					today: getIsoDateInTimeZone(now, timeZone.data),
					minimumStay: accommodation.minimumStay,
					maximumStay: accommodation.maximumStay,
					maxGuests: accommodation.maxGuests,
					sameDayReservation: accommodation.sameDayReservation,
					checkInStart: accommodation.checkInStart,
					timeZone: timeZone.data,
					now
				});

				const parsed = schema.safeParse({
					...$state.snapshot(values),
					accommodationId: accommodation._id,
					expectedBookingMode: accommodation.bookingMode ?? 'request'
				});

				if (!parsed.success) {
					errors = formValidationErrors(parsed.error.issues);
					toast.error(m['Components.Form.fixHighlightedFields']());
					return;
				}

				createdBookingId = await createBooking({
					...parsed.data,
					accommodationId: accommodation._id,
					guestId: guest.ensureGuestId()
				});

				toastMessage({
					type: 'success',
					message:
						accommodation.bookingMode === 'instant'
							? m['AccommodationsFeature.BookingMode.confirmed']()
							: m['BookingPage.BookingCheckout.booked']()
				});
			}

			await gotoParaglide(resolve('/(app)/(unprotected)/book-confirmation/[id]', { id: createdBookingId }));
		} catch (error) {
			toastMessage({ type: 'error', error, message: m['ErrorMessages.unexpected']() });
		} finally {
			submitting = false;

			if (Object.values(errors).some(Boolean)) {
				await tick();
				focusFirstError(checkout);
			}
		}
	}
</script>

<div
	{@attach (node) => {
		checkout = node;
	}}
	class="grid grid-cols-1 items-start gap-9 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-16"
	aria-busy={submitting}
>
	<div class="min-w-0 lg:sticky lg:top-24 lg:col-start-2 lg:row-start-1">
		<BookSummary
			{accommodation}
			{checkInDate}
			{checkOutDate}
			guests={values.adults + values.children}
			{submitting}
			onBook={handleBookAccommodation}
		/>
	</div>

	<BookCheckoutForm
		{accommodation}
		bind:values
		bind:errors
		{submitting}
		onBook={handleBookAccommodation}
		{availabilityLoading}
	/>
</div>
