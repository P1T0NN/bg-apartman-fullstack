<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime.js';

	// COMPONENTS
	import * as Card from '@/components/ui/card/index.js';
	import Plural from '@/components/ui/custom-components/plural/plural.svelte';
	import BookingStatusBadge from '@/features/bookings/components/booking-status-badge/booking-status-badge.svelte';
	import FindBookingDetailsDialog from './find-booking-details-dialog/find-booking-details-dialog.svelte';
	import FindBookingClaimButton from './find-booking-claim-button.svelte';

	// UTILS
	import { formatDate } from '@/shared/utils/date.js';

	// TYPES
	import type { Booking } from '@/shared/features/bookings/types/bookingTypes.js';

	let { booking, token }: { booking: Booking; token: string } = $props();

	const id = $props.id();
</script>

<article aria-labelledby={id}>
	<Card.Root class="gap-5 py-5 shadow-none">
		<Card.Header
			class="flex flex-col items-start gap-3 px-5 sm:flex-row sm:justify-between sm:px-6"
		>
			<Card.Title class="min-w-0 flex-1">
				<h3 {id} class="text-lg leading-6 font-semibold wrap-anywhere">
					{booking.accommodationName}
				</h3>
			</Card.Title>

			<BookingStatusBadge status={booking.status} />
		</Card.Header>

		<Card.Content class="px-5 sm:px-6">
			<dl class="grid grid-cols-2 gap-x-4 gap-y-5 border-t pt-5 text-sm sm:grid-cols-3 sm:gap-6">
				<div>
					<dt class="text-muted-foreground">
						{m['FindBookingPage.FindBookingDetailsItem.checkIn']()}
					</dt>

					<dd class="mt-1 font-medium">
						<time datetime={booking.checkInDate}>
							{formatDate(Date.parse(booking.checkInDate), getLocale())}
						</time>
					</dd>
				</div>

				<div>
					<dt class="text-muted-foreground">
						{m['FindBookingPage.FindBookingDetailsItem.checkOut']()}
					</dt>

					<dd class="mt-1 font-medium">
						<time datetime={booking.checkOutDate}>
							{formatDate(Date.parse(booking.checkOutDate), getLocale())}
						</time>
					</dd>
				</div>

				<div class="col-span-2 sm:col-span-1">
					<dt class="text-muted-foreground">
						{m['FindBookingPage.FindBookingDetailsItem.guests']()}
					</dt>
					<dd class="mt-1 flex flex-wrap gap-x-1 font-medium">
						<Plural
							count={booking.adults}
							locale={getLocale()}
							forms={{
								one: m['FindBookingPage.FindBookingDetailsItem.adult'](),
								other: m['FindBookingPage.FindBookingDetailsItem.adults']()
							}}
						/>
						{#if booking.children > 0}
							<span aria-hidden="true">·</span>
							<Plural
								count={booking.children}
								locale={getLocale()}
								forms={{
									one: m['FindBookingPage.FindBookingDetailsItem.child'](),
									other: m['FindBookingPage.FindBookingDetailsItem.children']()
								}}
							/>
						{/if}
					</dd>
				</div>
			</dl>
		</Card.Content>

		<Card.Footer class="flex-col items-stretch gap-3 px-5 sm:flex-row sm:px-6">
			<FindBookingDetailsDialog {booking} />
			{#if booking.isClaimable}
				<FindBookingClaimButton bookingId={booking._id} {token} />
			{:else}
				<p class="text-sm leading-6 text-muted-foreground">
					{m['FindBookingPage.FindBookingDetailsItem.alreadyLinked']()}
				</p>
			{/if}
		</Card.Footer>
	</Card.Root>
</article>
