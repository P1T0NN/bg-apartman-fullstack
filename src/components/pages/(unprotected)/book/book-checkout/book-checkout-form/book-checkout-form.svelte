<script lang="ts">
	// LIBRARIES
	import { SvelteURLSearchParams } from 'svelte/reactivity';

	// COMPONENTS
	import BookSummaryPricing from '../../book-summary/book-summary-pricing.svelte';
	import PaymentMethodChoice from '@/features/payments/components/payment-method-choice/payment-method-choice.svelte';
	import AccommodationBookingMode from '@/features/accommodations/components/accommodation-booking-mode/accommodation-booking-mode.svelte';
	import AccommodationGuestCancellationPolicy from '@/features/accommodations/components/accommodation-guest-cancellation-policy/accommodation-guest-cancellation-policy.svelte';
	import BookingStayDates from '@/features/bookings/components/booking-stay-dates/booking-stay-dates.svelte';
	import BookCheckoutFormGuestDetails from './book-checkout-form-guest-details.svelte';
	import BookCheckoutFormGuests from './book-checkout-form-guests.svelte';
	import BookCheckoutConfirmButton from '../book-checkout-confirm-button.svelte';
	import * as Field from '@/components/ui/field/index.js';
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
	import type { calculateLoyaltyQuote } from '@/shared/features/loyalty/utils/calculateLoyaltyQuote.js';

	let {
		accommodation,
		quote,
		values = $bindable(),
		submitting,
		errors = $bindable(),
		onBook,
		availabilityLoading
	}: {
		accommodation: PublicAccommodation;
		quote: ReturnType<typeof calculateLoyaltyQuote>;
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
	<div class="min-w-0 lg:col-start-1 lg:row-start-1">
		<div class="mb-7 border-b pb-5 lg:hidden">
			<p class="font-semibold wrap-anywhere">{accommodation.name}</p>
			<p class="mt-1 text-sm text-muted-foreground">
				{accommodation.address.city}, {accommodation.address.country}
			</p>
		</div>
		<section class="pb-9 sm:pb-12">
			<div class="mb-6 flex items-start gap-4">
				<span
					class="pt-1 text-sm font-medium text-muted-foreground tabular-nums"
					aria-hidden="true"
				>
					01
				</span>
				<div>
					<h2 class="text-2xl font-semibold tracking-tight">
						{m['BookingPage.BookCheckoutForm.trip']()}
					</h2>
					<p class="mt-2 max-w-prose text-sm leading-6 text-muted-foreground">
						{m['BookingPage.BookCheckoutForm.tripHint']()}
					</p>
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
			<div class="mt-7 border-t pt-6">
				<h3 class="text-base font-semibold">
					{m['BookingPage.BookSummary.guests']()}
				</h3>
				<p class="mt-1 mb-5 text-sm text-muted-foreground">
					{m['BookingPage.BookCheckoutForm.guestLimit']({ count: accommodation.maxGuests })}
				</p>
				<div class="flex flex-col gap-5">
					<BookCheckoutFormGuests {accommodation} {values} {errors} {submitting} />
				</div>
			</div>
			<section
				id="booking-price-details"
				class="mt-7 scroll-mt-24 border-t pt-6 lg:hidden"
				aria-labelledby="booking-price-details-title"
			>
				<h3 id="booking-price-details-title" class="mb-5 text-base font-semibold">
					{m['AccommodationPage.priceDetails']()}
				</h3>
				<BookSummaryPricing
					{quote}
					{accommodation}
					{checkInDate}
					{checkOutDate}
					guests={values.adults + values.children}
				/>
			</section>
		</section>

		<section class="border-t py-9 sm:py-12">
			<div class="mb-7 flex items-start gap-4">
				<span
					class="pt-1 text-sm font-medium text-muted-foreground tabular-nums"
					aria-hidden="true"
				>
					02
				</span>
				<div>
					<h2 class="text-2xl font-semibold tracking-tight">
						{m['BookingPage.BookCheckoutForm.guestDetails']()}
					</h2>
					<p class="mt-2 max-w-prose text-sm leading-6 text-muted-foreground">
						{m['BookingPage.BookCheckoutForm.guestHint']()}
					</p>
				</div>
			</div>
			<Field.Group
				class="grid min-w-0 grid-cols-1 items-start gap-x-5 gap-y-4 sm:grid-cols-2 sm:gap-y-6"
			>
				<BookCheckoutFormGuestDetails {values} {errors} {submitting} />
			</Field.Group>
		</section>

		<section class="border-t py-9 sm:py-12">
			<div class="mb-5 flex items-start gap-4">
				<span
					class="pt-1 text-sm font-medium text-muted-foreground tabular-nums"
					aria-hidden="true"
				>
					03
				</span>
				<h2 class="text-2xl font-semibold tracking-tight">{m['PaymentsFeature.method']()}</h2>
			</div>
			<PaymentMethodChoice
				supported={accommodation.supportedPaymentMethods ?? 'cash'}
				value={values.paymentMethod}
				disabled={submitting}
				error={errors.paymentMethod}
				onValueChange={(method) => {
					values.paymentMethod = method;
					errors.paymentMethod = '';
				}}
			/>
		</section>
		<section class="rounded-2xl bg-muted/60 p-5 sm:p-7">
			<div class="mb-6 flex items-start gap-4">
				<span
					class="pt-1 text-sm font-medium text-muted-foreground tabular-nums"
					aria-hidden="true"
				>
					04
				</span>
				<h2 class="text-2xl font-semibold tracking-tight">
					{m['BookingPage.BookingConfirmation.next']()}
				</h2>
			</div>
			<AccommodationBookingMode mode={accommodation.bookingMode} />
			<p class="mt-3 max-w-prose text-sm leading-6 text-muted-foreground">
				{m['BookingsFeature.BookingStayDatesLegend.availabilityHint']()}
			</p>
			<div class="mt-5 flex flex-col gap-3 border-t pt-5 text-sm leading-6">
				<AccommodationGuestCancellationPolicy {accommodation} {checkInDate} currentOnly />
				<ButtonLink
					href={cancellationPolicyHref}
					variant="link"
					class="h-auto w-fit justify-start px-0 text-left whitespace-normal"
				>
					{m['AccommodationPage.AccommodationSummary.cancellationDetails']()}
				</ButtonLink>
			</div>
			<BookCheckoutConfirmButton
				{submitting}
				mode={accommodation.bookingMode}
				onclick={onBook}
				class="hidden sm:w-full lg:inline-flex"
			/>
		</section>
	</div>
{:else}
	<p role="status" class="text-sm text-muted-foreground">
		{m['BackendMessages.bookingTermsUnavailable']()}
	</p>
{/if}
