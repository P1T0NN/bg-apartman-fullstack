<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime';

	// COMPONENTS
	import NativeAvatar from '@/components/ui/native-components/native-avatar/native-avatar.svelte';
	import Plural from '@/components/ui/custom-components/plural/plural.svelte';
	import BookingStatusBadge from '@/features/bookings/components/booking-status-badge/booking-status-badge.svelte';
	import { TableCell } from '@/components/ui/table';
	import HostBookingsDetailsDialog from './host-bookings-details-dialog/host-bookings-details-dialog.svelte';
	import HostBookingsItemActions from './host-bookings-item-actions/host-bookings-item-actions.svelte';

	// UTILS
	import { getBookingNights } from '@/shared/features/bookings/utils/getBookingNights.js';
	import { formatFullName } from '@/shared/utils/formatFullName.js';
	import { formatDate, formatDateTime, formatRelativeTime } from '@/shared/utils/date.js';

	// TYPES
	import type { HostBookingItem } from '@/shared/features/bookings/types/bookingHostTypes.js';

	let { booking, layout = 'table' }: { booking: HostBookingItem; layout?: 'table' | 'stacked' } =
		$props();

	let failedImageUrl = $state('');

	const guestName = $derived(formatFullName(booking.firstName, booking.lastName));
	const nights = $derived(getBookingNights(booking.checkInDate, booking.checkOutDate));
	const guests = $derived(booking.adults + booking.children);
	const isPending = $derived(booking.status === 'pending');
</script>

{#snippet guest()}
	<div class="flex min-w-0 items-start gap-3">
		<NativeAvatar name={guestName} size="sm" />

		<div class="flex min-w-0 flex-col gap-1">
			<p class="font-semibold wrap-break-word">{guestName}</p>

			<time
				datetime={new Date(booking._creationTime).toISOString()}
				title={formatDateTime(booking._creationTime, getLocale())}
				class="text-xs text-muted-foreground"
			>
				{m['HostBookingsPage.HostBookingsItem.requested']({
					time: formatRelativeTime(booking._creationTime, getLocale())
				})}
			</time>
		</div>
	</div>
{/snippet}

{#snippet stay()}
	<div class="flex flex-col gap-2">
		<div class="flex flex-wrap items-baseline gap-x-2 gap-y-1 font-semibold">
			<time datetime={booking.checkInDate}>
				{formatDate(Date.parse(booking.checkInDate), getLocale())}
			</time>
			<span class="text-muted-foreground" aria-hidden="true">&rarr;</span>
			<span class="sr-only">{m['HostBookingsPage.HostBookingsItem.until']()}</span>
			<time datetime={booking.checkOutDate}>
				{formatDate(Date.parse(booking.checkOutDate), getLocale())}
			</time>
		</div>
		<div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
			<span>
				{#if nights === 0}
					{m['AccommodationsFeature.ReservationRulesGuest.dayUse']()}
				{:else}
					<Plural
						count={nights}
						forms={{
							one: m['HostBookingsPage.HostBookingsItem.night'](),
							other: m['HostBookingsPage.HostBookingsItem.nights']()
						}}
						locale={getLocale()}
					/>
				{/if}
			</span>
			<span
				title={m['HostBookingsPage.HostBookingsItem.guestBreakdown']({
					adults: booking.adults,
					children: booking.children
				})}
			>
				<Plural
					count={guests}
					forms={{
						one: m['HostBookingsPage.HostBookingsItem.guest'](),
						other: m['HostBookingsPage.HostBookingsItem.guests']()
					}}
					locale={getLocale()}
				/>
			</span>
		</div>
		{#if booking.specialRequests}
			<p class="inline-flex items-center gap-1.5 text-xs font-medium">
				<span
					class="icon-[lucide--message-square] size-3.5 text-muted-foreground"
					aria-hidden="true"
				></span>
				{m['HostBookingsPage.HostBookingsItem.specialRequest']()}
			</p>
		{/if}
	</div>
{/snippet}

{#snippet property()}
	{#if booking.accommodation}
		<div class="flex min-w-0 items-center gap-3">
			<div class="size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
				{#if booking.accommodation.imageUrl && failedImageUrl !== booking.accommodation.imageUrl}
					<img
						src={booking.accommodation.imageUrl}
						alt=""
						width="40"
						height="40"
						loading="lazy"
						decoding="async"
						class="size-full object-cover"
						onerror={() => (failedImageUrl = booking.accommodation?.imageUrl ?? '')}
					/>
				{:else}
					<span
						class="flex size-full items-center justify-center text-muted-foreground"
						aria-hidden="true"
					>
						<span class="icon-[lucide--house] size-4"></span>
					</span>
				{/if}
			</div>
			<p class="min-w-0 text-sm font-medium wrap-break-word">{booking.accommodation.name}</p>
		</div>
	{:else}
		<p class="text-sm text-muted-foreground">
			{m['HostBookingsPage.HostBookingsItem.unavailable']()}
		</p>
	{/if}
{/snippet}

{#snippet status()}
	<div class="flex flex-col items-start gap-2">
		<BookingStatusBadge status={booking.status} />
		{#if isPending}
			<p class="max-w-36 text-xs leading-5 text-muted-foreground">
				{m['HostBookingsPage.HostBookingsItem.awaitingResponse']()}
			</p>
		{/if}
	</div>
{/snippet}

{#snippet actions()}
	<div
		class="flex flex-wrap items-center gap-2 xl:justify-end [&_button]:min-h-10 xl:[&_button]:min-h-8"
	>
		<HostBookingsItemActions {booking} />
		<HostBookingsDetailsDialog {booking} />
	</div>
{/snippet}

{#if layout === 'stacked'}
	<article class="flex min-w-0 flex-col gap-5 rounded-xl border p-4 sm:p-5">
		<div class="flex flex-wrap items-start justify-between gap-3">
			{@render guest()}{@render status()}
		</div>
		{@render property()}
		{@render stay()}
		<div class="border-t pt-4">{@render actions()}</div>
	</article>
{:else}
	<TableCell class="w-1/4 min-w-40 py-5 whitespace-normal">{@render guest()}</TableCell>
	<TableCell class="min-w-52 py-5 whitespace-normal">{@render stay()}</TableCell>
	<TableCell class="min-w-40 py-5 whitespace-normal">{@render property()}</TableCell>
	<TableCell class="py-5 whitespace-normal">{@render status()}</TableCell>
	<TableCell class="py-5 whitespace-normal">{@render actions()}</TableCell>
{/if}
