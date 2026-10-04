<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime.js';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import BookingCancellationPolicy from '@/features/bookings/components/booking-cancellation-policy/booking-cancellation-policy.svelte';
	import { Separator } from '@/components/ui/separator/index.js';

	// UTILS
	import { DAY_IN_MS, formatDate } from '@/shared/utils/date.js';

	// TYPES
	import type { FunctionReturnType } from 'convex/server';
	import type { api } from '@convex/_generated/api';

	let {
		confirmation
	}: {
		confirmation: NonNullable<
			FunctionReturnType<
				typeof api.tables.bookings.queries.fetchBookingConfirmation.fetchBookingConfirmation
			>
		>;
	} = $props();

	const nights = $derived(
		(Date.parse(confirmation.checkOutDate) - Date.parse(confirmation.checkInDate)) / DAY_IN_MS
	);
</script>

<div class="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-12">
	<section aria-labelledby="stay-title" class="min-w-0 overflow-hidden rounded-2xl border bg-card">
		<div class="bg-muted/40 px-6 py-7 sm:px-8">
			<p class="mb-3 text-xs font-medium tracking-wider text-muted-foreground uppercase">
				{m['BookingPage.BookingConfirmation.stay']()}
			</p>
			<h2 id="stay-title" class="text-2xl leading-snug font-semibold tracking-tight wrap-anywhere">
				{confirmation.accommodationName}
			</h2>
		</div>

		<div class="px-6 py-7 sm:px-8">
			<dl class="grid grid-cols-2 gap-5">
				<div>
					<dt class="text-sm text-muted-foreground">
						{m['AccommodationPage.AccommodationDetailsRules.checkIn']()}
					</dt>
					<dd class="mt-2 text-lg font-semibold">
						<time datetime={confirmation.checkInDate}>
							{formatDate(Date.parse(confirmation.checkInDate), getLocale())}
						</time>
					</dd>
				</div>

				<div>
					<dt class="text-sm text-muted-foreground">
						{m['BookingPage.BookingConfirmation.checkOut']()}
					</dt>
					<dd class="mt-2 text-lg font-semibold">
						<time datetime={confirmation.checkOutDate}>
							{formatDate(Date.parse(confirmation.checkOutDate), getLocale())}
						</time>
					</dd>
				</div>
			</dl>

			<Separator class="my-7" />

			<dl class="grid grid-cols-2 gap-5">
				<div>
					<dt class="text-sm text-muted-foreground">{m['BookingPage.BookingSummary.nights']()}</dt>
					<dd class="mt-2 text-xl font-semibold tabular-nums">{nights}</dd>
				</div>

				<div>
					<dt class="text-sm text-muted-foreground">{m['BookingPage.BookingSummary.guests']()}</dt>

					<dd class="mt-2 text-xl font-semibold tabular-nums">
						{confirmation.adults + confirmation.children}
					</dd>
					
					<dd class="mt-1 text-xs leading-5 text-muted-foreground">
						{m['BookingPage.BookingCheckout.adults']()}: {confirmation.adults} &middot; {m[
							'BookingPage.BookingCheckout.children'
						]()}: {confirmation.children}
					</dd>
				</div>
			</dl>

			<div class="mt-8 border-t pt-6">
				<BookingCancellationPolicy
					policy={confirmation.cancellationTerms.policy}
					timeZone={confirmation.cancellationTerms.timeZone}
					checkInAt={confirmation.cancellationTerms.checkInAt}
					status={confirmation.status}
					booked
				/>
			</div>

			<div class="mt-8">
				<Button
					href={UNPROTECTED_PAGE_ENDPOINTS.ACCOMMODATION(confirmation.accommodationId)}
					variant="outline"
					size="lg"
					class="w-full sm:w-auto"
				>
					{m['BookingPage.BookingConfirmation.viewAccommodation']()}
					<span class="icon-[lucide--arrow-up-right]" aria-hidden="true"></span>
				</Button>
			</div>
		</div>
	</section>

	<aside aria-labelledby="next-title" class="pt-1 lg:pt-7">
		<h2 id="next-title" class="text-lg font-semibold">
			{m['BookingPage.BookingConfirmation.next']()}
		</h2>

		<p class="mt-3 text-sm leading-6 text-muted-foreground">
			{confirmation.status === 'expired'
				? m['BookingsFeature.status.expiredHint']()
				: m['BookingPage.BookingConfirmation.nextHint']()}
		</p>

		<Separator class="my-6" />

		<div class="flex items-start gap-3">
			<span
				class="mt-1 icon-[lucide--bookmark] size-4 shrink-0 text-muted-foreground"
				aria-hidden="true"
			></span>

			<p class="text-sm leading-6">{m['BookingPage.BookingConfirmation.saveLink']()}</p>
		</div>
		
		<p class="mt-6 text-xs leading-5 text-muted-foreground">
			{m['BookingPage.BookingConfirmation.noPayment']()}
		</p>
	</aside>
</div>
