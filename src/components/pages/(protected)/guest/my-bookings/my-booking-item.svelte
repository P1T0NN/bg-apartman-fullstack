<script lang="ts">
	// COMPONENTS
	import BookingCancellationDialog from '@/features/bookings/components/booking-cancellation-dialog/booking-cancellation-dialog.svelte';
	import BookingCancellationDetails from '@/features/bookings/components/booking-cancellation-details/booking-cancellation-details.svelte';
	import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
	import { Badge, type BadgeVariant } from '@/components/ui/badge/index.js';
	import { Button } from '@/components/ui/button/index.js';
	import Plural from '@/components/ui/custom-components/plural/plural.svelte';
	import AccommodationLocation from '@/features/accommodations/components/accommodation-location/accommodation-location.svelte';
	import MyReviewDetailsDialog from '@/components/pages/(protected)/guest/my-reviews/my-review-details-dialog/my-review-details-dialog.svelte';
	import ReviewDialog from '@/features/reviews/components/review-dialog/review-dialog.svelte';
	import BookingCancellationPolicy from '@/features/bookings/components/booking-cancellation-policy/booking-cancellation-policy.svelte';

	// UTILS
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime.js';
	import { getBookingNights } from '@/shared/features/bookings/utils/getBookingNights.js';
	import { formatFullName } from '@/shared/utils/formatFullName.js';
	import { formatDate } from '@/shared/utils/date.js';
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';
	import { canReviewBooking } from '@/shared/features/reviews/utils/canReviewBooking.js';

	// TYPES
	import type { FunctionReturnType } from 'convex/server';
	import type { api } from '@convex/_generated/api';
	import type { BookingStatus } from '@/shared/features/bookings/schemas/bookingSchemas.js';

	let {
		booking,
		now
	}: {
		booking: FunctionReturnType<
			typeof api.tables.bookings.queries.fetchMyBookings.fetchMyBookings
		>['items'][number];
		now: number;
	} = $props();
	let failedImageUrl = $state('');

	const statuses = {
		pending: {
			label: m['MyBookingsPage.MyBookingItem.pending'],
			hint: m['MyBookingsPage.MyBookingItem.pendingHint'],
			variant: 'secondary'
		},
		confirmed: {
			label: m['MyBookingsPage.MyBookingItem.confirmed'],
			hint: m['MyBookingsPage.MyBookingItem.confirmedHint'],
			variant: 'default'
		},
		declined: {
			label: m['MyBookingsPage.MyBookingItem.declined'],
			hint: m['MyBookingsPage.MyBookingItem.declinedHint'],
			variant: 'destructive'
		},
		cancelled: {
			label: m['MyBookingsPage.MyBookingItem.cancelled'],
			hint: m['MyBookingsPage.MyBookingItem.cancelledHint'],
			variant: 'outline'
		},
		completed: {
			label: m['MyBookingsPage.MyBookingItem.completed'],
			hint: m['MyBookingsPage.MyBookingItem.completedHint'],
			variant: 'outline'
		}
	} satisfies Record<
		BookingStatus,
		{ label: () => string; hint: () => string; variant: BadgeVariant }
	>;

	const status = $derived(statuses[booking.status]);
	const guestName = $derived(formatFullName(booking.firstName, booking.lastName));
	const nights = $derived(getBookingNights(booking.checkInDate, booking.checkOutDate));
</script>

<article class="overflow-hidden rounded-2xl border bg-card text-card-foreground">
	<div
		class="grid grid-cols-[4rem_minmax(0,1fr)] gap-5 p-5 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-6 sm:p-6"
	>
		<div
			class="flex size-16 items-center justify-center overflow-hidden rounded-xl bg-muted sm:size-28"
		>
			{#if booking.accommodation?.imageUrl && failedImageUrl !== booking.accommodation.imageUrl}
				<img
					src={booking.accommodation.imageUrl}
					alt=""
					class="size-full object-cover"
					width="112"
					height="112"
					loading="lazy"
					onerror={() => {
						failedImageUrl = booking.accommodation?.imageUrl ?? '';
					}}
				/>
			{:else}
				<span class="icon-[lucide--house] size-7 text-muted-foreground" aria-hidden="true"></span>
			{/if}
		</div>

		<div class="contents sm:block sm:min-w-0">
			<div class="flex flex-wrap items-start justify-between gap-3">
				<div class="min-w-0 flex-1 basis-48">
					<h2 class="text-lg leading-6 font-semibold tracking-tight wrap-anywhere">
						{booking.accommodation?.name ?? m['MyBookingsPage.MyBookingItem.unavailable']()}
					</h2>
					{#if booking.accommodation}
						<p class="mt-1 text-sm wrap-anywhere text-muted-foreground">
							<AccommodationLocation
								city={booking.accommodation.city}
								country={booking.accommodation.country}
							/>
						</p>
					{/if}
				</div>
				<Badge variant={status.variant}>{status.label()}</Badge>
			</div>

			<dl class="col-span-2 grid grid-cols-2 gap-x-5 gap-y-4 sm:mt-6 sm:grid-cols-[1fr_1fr_auto]">
				<div>
					<dt class="text-xs text-muted-foreground">
						{m['MyBookingsPage.MyBookingItem.checkIn']()}
					</dt>
					<dd class="mt-1 text-sm font-medium">
						<time datetime={booking.checkInDate}>
							{formatDate(Date.parse(booking.checkInDate), getLocale())}
						</time>
					</dd>
				</div>
				<div>
					<dt class="text-xs text-muted-foreground">
						{m['MyBookingsPage.MyBookingItem.checkOut']()}
					</dt>
					<dd class="mt-1 text-sm font-medium">
						<time datetime={booking.checkOutDate}>
							{formatDate(Date.parse(booking.checkOutDate), getLocale())}
						</time>
					</dd>
				</div>
				<div class="col-span-2 sm:col-span-1">
					<dt class="text-xs text-muted-foreground">{m['MyBookingsPage.MyBookingItem.trip']()}</dt>
					<dd class="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-sm font-medium">
						<span>
							<Plural
								count={nights}
								forms={{
									one: m['MyBookingsPage.MyBookingItem.night'](),
									other: m['MyBookingsPage.MyBookingItem.nights']()
								}}
								locale={getLocale()}
							/>
						</span>
						<span class="text-muted-foreground" aria-hidden="true">&middot;</span>
						<span>
							<Plural
								count={booking.adults + booking.children}
								forms={{
									one: m['MyBookingsPage.MyBookingItem.guest'](),
									other: m['MyBookingsPage.MyBookingItem.guests']()
								}}
								locale={getLocale()}
							/>
						</span>
					</dd>
				</div>
			</dl>
		</div>
	</div>

	<div
		class="flex flex-col gap-4 border-t bg-muted/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6"
	>
		<p class="max-w-prose text-sm leading-5 text-muted-foreground">{status.hint()}</p>
		<BookingCancellationDialog
			{booking}
			accommodationName={booking.accommodation?.name ??
				m['MyBookingsPage.MyBookingItem.unavailable']()}
			{now}
		/>
		{#if booking.reviewId}
			<MyReviewDetailsDialog reviewId={booking.reviewId} />
		{:else if booking.accommodation && canReviewBooking(booking, now)}
			<ReviewDialog
				bookingId={booking._id}
				accommodationName={booking.accommodation.name}
				checkInDate={booking.checkInDate}
				checkOutDate={booking.checkOutDate}
				timeZone={booking.cancellationTerms.timeZone}
			/>
		{/if}
		{#if booking.accommodation}
			<Button
				href={UNPROTECTED_PAGE_ENDPOINTS.ACCOMMODATION(booking.accommodationId)}
				variant="outline"
				size="lg"
				class="w-full shrink-0 sm:w-auto"
				aria-label={m['MyBookingsPage.MyBookingItem.viewAccommodationLabel']({
					name: booking.accommodation.name
				})}
			>
				{m['MyBookingsPage.MyBookingItem.viewAccommodation']()}
				<ArrowUpRightIcon data-icon="inline-end" />
			</Button>
		{/if}
	</div>

	{#if booking.cancellation}
		<div class="border-t px-5 py-4 sm:px-6">
			<BookingCancellationDetails
				cancellation={booking.cancellation}
				timeZone={booking.cancellationTerms.timeZone}
			/>
		</div>
	{/if}

	<details class="group border-t px-5 sm:px-6">
		<summary
			class="flex min-h-12 cursor-pointer items-center gap-3 py-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
		>
			{m['MyBookingsPage.MyBookingItem.cancellationDetails']()}
		</summary>
		<div class="pb-6">
			<BookingCancellationPolicy
				policy={booking.cancellationTerms.policy}
				timeZone={booking.cancellationTerms.timeZone}
				checkInAt={booking.cancellationTerms.checkInAt}
				status={booking.status}
				booked
			/>
		</div>
	</details>

	<details class="group border-t px-5 sm:px-6">
		<summary
			class="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 py-3 text-sm font-medium focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 [&::-webkit-details-marker]:hidden"
		>
			{m['MyBookingsPage.MyBookingItem.details']()}
			<span
				class="icon-[lucide--chevron-down] size-4 shrink-0 text-muted-foreground group-open:rotate-180"
				aria-hidden="true"
			></span>
		</summary>
		<div class="flex flex-col gap-5 pt-1 pb-6">
			<dl class="grid gap-4 text-sm sm:grid-cols-2">
				<div>
					<dt class="text-xs text-muted-foreground">
						{m['MyBookingsPage.MyBookingItem.leadGuest']()}
					</dt>
					<dd class="mt-1 wrap-anywhere">{guestName}</dd>
				</div>
				<div>
					<dt class="text-xs text-muted-foreground">
						{m['MyBookingsPage.MyBookingItem.guestBreakdown']()}
					</dt>
					<dd class="mt-1">
						{m['MyBookingsPage.MyBookingItem.adults']()}: {booking.adults} &middot; {m[
							'MyBookingsPage.MyBookingItem.children'
						]()}: {booking.children}
					</dd>
				</div>
				<div>
					<dt class="text-xs text-muted-foreground">{m['MyBookingsPage.MyBookingItem.email']()}</dt>
					<dd class="mt-1 wrap-anywhere">{booking.email}</dd>
				</div>
				<div>
					<dt class="text-xs text-muted-foreground">{m['MyBookingsPage.MyBookingItem.phone']()}</dt>
					<dd class="mt-1 wrap-anywhere">{booking.phone}</dd>
				</div>
			</dl>
			{#if booking.specialRequests}
				<div>
					<h3 class="text-sm font-medium">{m['MyBookingsPage.MyBookingItem.requests']()}</h3>
					<p class="mt-2 max-w-prose text-sm leading-6 wrap-anywhere whitespace-pre-line">
						{booking.specialRequests}
					</p>
					<p class="mt-1 text-xs leading-5 text-muted-foreground">
						{m['MyBookingsPage.MyBookingItem.requestsHint']()}
					</p>
				</div>
			{/if}
			<p class="text-xs text-muted-foreground">
				{m['MyBookingsPage.MyBookingItem.requested']({
					date: formatDate(booking._creationTime, getLocale())
				})}
			</p>
		</div>
	</details>
</article>
