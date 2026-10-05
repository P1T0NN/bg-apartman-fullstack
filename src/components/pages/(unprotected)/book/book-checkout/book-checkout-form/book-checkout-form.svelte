<script lang="ts">
	// LIBRARIES
	import { SvelteURLSearchParams } from 'svelte/reactivity';

	// COMPONENTS
	import AccommodationBookingMode from '@/features/accommodations/components/accommodation-booking-mode/accommodation-booking-mode.svelte';
	import AccommodationGuestCancellationPolicy from '@/features/accommodations/components/accommodation-guest-cancellation-policy/accommodation-guest-cancellation-policy.svelte';
	import BookingStayDates from '@/features/bookings/components/booking-stay-dates/booking-stay-dates.svelte';
	import BookCheckoutFormGuestDetails from './book-checkout-form-guest-details.svelte';
	import BookCheckoutFormGuests from './book-checkout-form-guests.svelte';
	import BookCheckoutConfirmButton from '../book-checkout-confirm-button.svelte';
	import ButtonLink from '@/components/ui/custom-components/button-link/button-link.svelte';

	// UTILS
	import { m } from '@/lib/paraglide/messages';
	import { parseIsoDate, toIsoDate } from '@/shared/utils/date.js';
	import { getIsoDateInTimeZone } from '@/shared/features/timezone/utils/getIsoDateInTimeZone.js';
	import { getMinimumDate } from '@/shared/features/accommodations/utils/getMinimumDate.js';
	import { timeZoneSchema } from '@/shared/features/timezone/schemas/timezoneSchemas.js';
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// TYPES
	import type { PublicAccommodation } from '@/shared/features/accommodations/types/accommodationTypes.js';
	import type { BookingCheckoutValues } from '@/shared/features/bookings/types/bookingTypes.js';

	let {
		accommodation,
		values = $bindable(),
		submitting,
		errors = $bindable(),
		onBook,
		availabilityLoading
	}: {
		accommodation: PublicAccommodation;
		values: BookingCheckoutValues;
		errors: Record<string, string>;
		onBook: () => Promise<void>;
		submitting: boolean;
		availabilityLoading: boolean;
	} = $props();

	const currentTimestamp = Date.now();
	const timeZone = $derived(timeZoneSchema.safeParse(accommodation.timeZone));
	const currentDate = $derived(
		timeZone.success ? getIsoDateInTimeZone(currentTimestamp, timeZone.data) : ''
	);

	const overnightMinDate = $derived(getMinimumDate(currentDate, currentTimestamp, accommodation));
	const checkInDate = $derived(values.checkInDate);
	const checkOutDate = $derived(values.checkOutDate);
	const stayError = $derived(errors.stayDates || errors.checkInDate || errors.checkOutDate);

	const cancellationPolicyHref = $derived.by(() => {
		const query = new SvelteURLSearchParams({ section: 'cancellation-policy' });
		if (checkInDate) query.set('checkIn', checkInDate);
		if (checkOutDate) query.set('checkOut', checkOutDate);
		query.set('adults', String(values.adults ?? 1));
		query.set('children', String(values.children ?? 0));
		return `${UNPROTECTED_PAGE_ENDPOINTS.ACCOMMODATION(accommodation._id)}?${query}#cancellation-policy`;
	});
</script>

{#if timeZone.success}
	<div class="flex min-w-0 flex-col gap-6 lg:col-start-1 lg:row-start-1">
		<div>
			<h2 class="flex items-center gap-3 text-xl font-semibold">
				<span
					class="flex size-8 items-center justify-center rounded-full bg-muted text-sm"
					aria-hidden="true"
				>
					1
				</span>
				{m['BookingPage.BookCheckoutForm.trip']()}
			</h2>

			<p class="mt-3 text-sm text-muted-foreground">
				{m['BookingPage.BookCheckoutForm.tripHint']()}
			</p>

			<div class="mt-4">
				<AccommodationBookingMode mode={accommodation.bookingMode} />
			</div>
		</div>

		<BookingStayDates
			{accommodation}
			{availabilityLoading}
			value={{ start: parseIsoDate(checkInDate), end: parseIsoDate(checkOutDate) }}
			minValue={overnightMinDate}
			disabled={submitting}
			error={stayError}
			onValueChange={(range) => {
				values.checkInDate = range.start ? toIsoDate(range.start) : '';
				values.checkOutDate = range.end ? toIsoDate(range.end) : '';
				errors.stayDates = '';
				errors.checkInDate = '';
				errors.checkOutDate = '';
			}}
		/>

		<BookCheckoutFormGuests {accommodation} {values} {errors} {submitting} />

		<p class="text-xs leading-5 text-muted-foreground">
			{m['BookingPage.BookCheckoutForm.limits']({
				minimum: accommodation.minimumStay,
				guests: accommodation.maxGuests
			})}
		</p>

		<div class="border-t pt-8">
			<h2 class="flex items-center gap-3 text-xl font-semibold">
				<span
					class="flex size-8 items-center justify-center rounded-full bg-muted text-sm"
					aria-hidden="true"
				>
					2
				</span>
				{m['BookingPage.BookCheckoutForm.guestDetails']()}
			</h2>
			<p class="mt-3 text-sm text-muted-foreground">
				{m['BookingPage.BookCheckoutForm.guestHint']()}
			</p>
		</div>

		<BookCheckoutFormGuestDetails {values} {errors} {submitting} />

		<div class="border-t pt-8">
			<div class="flex flex-col gap-4 text-sm leading-6">
				<AccommodationGuestCancellationPolicy {accommodation} {checkInDate} currentOnly />

				<ButtonLink
					href={cancellationPolicyHref}
					variant="link"
					class="h-auto w-fit justify-start px-0"
				>
					{m['AccommodationPage.AccommodationSummary.cancellationDetails']()}
				</ButtonLink>
			</div>

			<BookCheckoutConfirmButton {submitting} mode={accommodation.bookingMode} onclick={onBook} />
		</div>
	</div>
{:else}
	<p role="status" class="text-sm text-muted-foreground">
		{m['BackendMessages.bookingTermsUnavailable']()}
	</p>
{/if}
