<script lang="ts">
	// SVELTEKIT IMPORTS
	import { page } from '$app/state';
	import { resolve } from '$app/paths';

	// LIBRARIES
	import { api } from '@convex/_generated/api';
	import { useMutation } from 'convex-svelte';
	import { toast } from 'svelte-sonner';
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import Price from '@/components/ui/custom-components/price/price.svelte';
	import BookCheckoutConfirmButton from './book-checkout-confirm-button.svelte';
	import BookSummary from '../book-summary/book-summary.svelte';
	import BookCheckoutForm from './book-checkout-form/book-checkout-form.svelte';

	// HOOKS
	import { useSearchParams } from '@/hooks/useSearchParams.svelte.js';
	import { useGuestLocal } from '@/features/guests/hooks/useGuestLocal.svelte.js';

	// UTILS
	import { calculateStayPricing } from '@/shared/features/bookings/utils/calculateStayPricing.js';
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
		specialRequests: '',
		paymentMethod: ''
	});
	let submitting = $state(false);
	let errors = $state<Record<string, string>>({});

	const checkInDate = $derived(values.checkInDate);
	const checkOutDate = $derived(values.checkOutDate);
	const stayPricing = $derived(calculateStayPricing(accommodation, checkInDate, checkOutDate));
	const nights = $derived(stayPricing.regularNights + stayPricing.weekendNights);
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
					paymentMethod:
						accommodation.supportedPaymentMethods === 'both'
							? values.paymentMethod
							: (accommodation.supportedPaymentMethods ?? 'cash'),
					accommodationId: accommodation._id,
					expectedPricePerNightMinor: accommodation.effectivePricePerNightMinor,
					expectedTotalMinor: calculateStayPricing(
						accommodation,
						values.checkInDate,
						values.checkOutDate
					).totalMinor,
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

			await gotoParaglide(
				resolve('/(app)/(unprotected)/book-confirmation/[id]', { id: createdBookingId })
			);
		} catch (error) {
			toastMessage({ type: 'error', error, message: m['ErrorMessages.unexpected']() });
		} finally {
			submitting = false;
			focusFirstError(checkout, errors);
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
	<div class="hidden min-w-0 lg:sticky lg:top-24 lg:col-start-2 lg:row-start-1 lg:block">
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

{#if timeZone.success}
	<div
		class="fixed inset-x-0 bottom-0 isolate border-t bg-background px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden"
	>
		<div class="mx-auto flex max-w-6xl items-center justify-between gap-3">
			<div class="min-w-0" aria-live="polite" aria-atomic="true">
				<p class="text-xs text-muted-foreground">
					{nights > 0
						? m['BookingPage.BookSummary.estimate']()
						: m['BookingPage.BookSummary.nightlyRate']()}
				</p>
				<p class="text-lg font-semibold wrap-anywhere tabular-nums">
					<Price
						value={nights > 0 ? stayPricing.totalMinor : accommodation.effectivePricePerNightMinor}
					/>
				</p>
				<Button
					variant="link"
					href="#booking-price-details"
					class="h-auto justify-start p-0 text-xs"
				>
					{m['AccommodationPage.priceDetails']()}
				</Button>
			</div>
			<BookCheckoutConfirmButton
				{submitting}
				mode={accommodation.bookingMode}
				onclick={handleBookAccommodation}
				class="mt-0 w-auto max-w-[60%] min-w-0 text-center whitespace-normal"
			/>
		</div>
	</div>
{/if}
