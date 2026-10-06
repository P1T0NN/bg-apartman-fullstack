<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime.js';

	// COMPONENTS
	import BookingPriceBreakdown from '@/features/bookings/components/booking-price-breakdown/booking-price-breakdown.svelte';
	import Plural from '@/components/ui/custom-components/plural/plural.svelte';
	import BookingCancellationPolicy from '@/features/bookings/components/booking-cancellation-policy/booking-cancellation-policy.svelte';

	// UTILS
	import { formatDate } from '@/shared/utils/date.js';
	import { formatFullName } from '@/shared/utils/formatFullName.js';

	// TYPES
	import type { Booking } from '@/shared/features/bookings/types/bookingTypes.js';

	let { booking }: { booking: Booking } = $props();
</script>

{#if booking.cancellationTerms.stayPricing}<BookingPriceBreakdown
		pricing={{
			pricePerNightMinor: booking.cancellationTerms.basePricePerNightMinor,
			effectivePricePerNightMinor: booking.cancellationTerms.pricePerNightMinor,
			discountBps: booking.cancellationTerms.discountBps
		}}
		stayPricing={booking.cancellationTerms.stayPricing}
	/>{/if}
{#if booking.paymentMethod}
	<p class="text-sm">
		<span class="text-muted-foreground">{m['PaymentsFeature.method']()}:</span>
		<span class="font-medium">{m[`PaymentsFeature.methods.${booking.paymentMethod}`]()}</span>
	</p>
{/if}
<dl class="grid min-w-0 grid-cols-2 gap-x-4 gap-y-5 border-t pt-5 text-sm sm:gap-x-6">
	<div>
		<dt class="text-muted-foreground">
			{m['FindBookingPage.FindBookingDetailsDialogContent.checkIn']()}
		</dt>

		<dd class="mt-1 font-medium">
			<time datetime={booking.checkInDate}>
				{formatDate(Date.parse(booking.checkInDate), getLocale())}
			</time>
		</dd>
	</div>

	<div>
		<dt class="text-muted-foreground">
			{m['FindBookingPage.FindBookingDetailsDialogContent.checkOut']()}
		</dt>

		<dd class="mt-1 font-medium">
			<time datetime={booking.checkOutDate}>
				{formatDate(Date.parse(booking.checkOutDate), getLocale())}
			</time>
		</dd>
	</div>

	<div class="col-span-2">
		<dt class="text-muted-foreground">
			{m['FindBookingPage.FindBookingDetailsDialogContent.guests']()}
		</dt>

		<dd class="mt-1 flex flex-wrap gap-x-1 font-medium">
			<Plural
				count={booking.adults}
				locale={getLocale()}
				forms={{
					one: m['FindBookingPage.FindBookingDetailsDialogContent.adult'](),
					other: m['FindBookingPage.FindBookingDetailsDialogContent.adults']()
				}}
			/>

			{#if booking.children > 0}
				<span aria-hidden="true">·</span>

				<Plural
					count={booking.children}
					locale={getLocale()}
					forms={{
						one: m['FindBookingPage.FindBookingDetailsDialogContent.child'](),
						other: m['FindBookingPage.FindBookingDetailsDialogContent.children']()
					}}
				/>
			{/if}
		</dd>
	</div>

	<div class="col-span-2 border-t pt-5">
		<dt class="text-muted-foreground">
			{m['FindBookingPage.FindBookingDetailsDialogContent.guestName']()}
		</dt>

		<dd class="mt-1 font-medium wrap-anywhere">
			{formatFullName(booking.firstName, booking.lastName)}
		</dd>
	</div>

	<div class="col-span-2 min-w-0 sm:col-span-1">
		<dt class="text-muted-foreground">
			{m['FindBookingPage.FindBookingDetailsDialogContent.email']()}
		</dt>

		<dd class="mt-1 font-medium wrap-anywhere">{booking.email}</dd>
	</div>
	{#if booking.phone}
		<div class="col-span-2 min-w-0 sm:col-span-1">
			<dt class="text-muted-foreground">
				{m['FindBookingPage.FindBookingDetailsDialogContent.phone']()}
			</dt>

			<dd class="mt-1 font-medium wrap-anywhere">{booking.phone}</dd>
		</div>
	{/if}

	{#if booking.specialRequests}
		<div class="col-span-2 border-t pt-5">
			<dt class="text-muted-foreground">
				{m['FindBookingPage.FindBookingDetailsDialogContent.specialRequests']()}
			</dt>

			<dd class="mt-2 leading-6 wrap-anywhere whitespace-pre-wrap">{booking.specialRequests}</dd>
		</div>
	{/if}
</dl>

<BookingCancellationPolicy
	policy={booking.cancellationTerms.policy}
	timeZone={booking.cancellationTerms.timeZone}
	checkInAt={booking.cancellationTerms.checkInAt}
	status={booking.status}
	booked
/>
