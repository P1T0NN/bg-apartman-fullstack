<script lang="ts">
	// COMPONENTS
	import BookingPriceBreakdown from '@/features/bookings/components/booking-price-breakdown/booking-price-breakdown.svelte';
	import BookingCancellationDetails from '@/features/bookings/components/booking-cancellation-details/booking-cancellation-details.svelte';
	import { Button } from '@/components/ui/button/index.js';
	import NativeDialog from '@/components/ui/native-components/native-dialog/native-dialog.svelte';
	import NativeAvatar from '@/components/ui/native-components/native-avatar/native-avatar.svelte';
	import BookingStatusBadge from '@/features/bookings/components/booking-status-badge/booking-status-badge.svelte';
	import HostBookingsItemActions from '../host-bookings-item-actions/host-bookings-item-actions.svelte';
	import HostBookingsDetailsDialogStay from './host-bookings-details-dialog-stay.svelte';
	import HostBookingsDetailsDialogGuests from './host-bookings-details-dialog-guests.svelte';
	import HostBookingsDetailsDialogGuestInfo from './host-bookings-details-dialog-guest-info.svelte';
	import HostBookingsDetailsDialogAccommodationInfo from './host-bookings-details-dialog-accommodation-info.svelte';
	import HostBookingsDetailsDialogSpecialRequests from './host-bookings-details-dialog-special-requests.svelte';
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime';

	// UTILS
	import { formatFullName } from '@/shared/utils/formatFullName.js';
	import { formatDateTime } from '@/shared/utils/date.js';

	// TYPES
	import type { HostBookingItem } from '@/shared/features/bookings/types/bookingHostTypes.js';

	let { booking }: { booking: HostBookingItem } = $props();

	const dialogId = $derived(`booking-details-${booking._id}`);
	const guestName = $derived(formatFullName(booking.firstName, booking.lastName));

	let dialog: NativeDialog;

	export function open() {
		dialog?.open();
	}
</script>

<NativeDialog bind:this={dialog} aria-labelledby={dialogId}>
	{#snippet children({ id })}
		<div class="flex min-w-0 flex-col gap-5 p-4 sm:p-6">
			<div class="flex items-start gap-3">
				<NativeAvatar name={guestName} size="lg" />
				<div class="flex min-w-0 flex-col items-start gap-1.5">
					<h2 id={dialogId} class="text-lg font-semibold break-words">{guestName}</h2>
					<BookingStatusBadge status={booking.status} />
				</div>
			</div>

			<dl class="grid min-w-0 gap-3 sm:grid-cols-2">
				<HostBookingsDetailsDialogStay
					checkInDate={booking.checkInDate}
					checkOutDate={booking.checkOutDate}
				/>

				<HostBookingsDetailsDialogGuests
					checkInDate={booking.checkInDate}
					checkOutDate={booking.checkOutDate}
					adults={booking.adults}
					children={booking.children}
				/>

				<HostBookingsDetailsDialogGuestInfo email={booking.email} phone={booking.phone} />

				<HostBookingsDetailsDialogAccommodationInfo accommodation={booking.accommodation} />
			</dl>

			{#if booking.cancellationTerms.stayPricing}<BookingPriceBreakdown
					pricing={{
						pricePerNightMinor: booking.cancellationTerms.basePricePerNightMinor,
						effectivePricePerNightMinor: booking.cancellationTerms.pricePerNightMinor,
						discountBps: booking.cancellationTerms.discountBps
					}}
					stayPricing={booking.cancellationTerms.stayPricing}
					loyaltyBenefits={booking.cancellationTerms.loyaltyBenefits}
				/>{/if}
			{#if booking.paymentMethod}
				<p class="text-sm">
					<span class="text-muted-foreground">{m['PaymentsFeature.method']()}:</span>
					<span class="font-medium">{m[`PaymentsFeature.methods.${booking.paymentMethod}`]()}</span>
				</p>
			{/if}
			{#if booking.cancellation}
				<BookingCancellationDetails
					cancellation={booking.cancellation}
					timeZone={booking.cancellationTerms.timeZone}
				/>
			{/if}

			{#if booking.specialRequests}
				<HostBookingsDetailsDialogSpecialRequests requests={booking.specialRequests} />
			{/if}

			<p class="text-xs text-muted-foreground">
				{m['HostBookingsPage.HostBookingsDetailsDialog.requested']({
					date: formatDateTime(booking._creationTime, getLocale())
				})}
			</p>

			<div class="flex flex-wrap items-center justify-end gap-2 border-t pt-4">
				<HostBookingsItemActions {booking} />
				<Button type="button" variant="outline" size="sm" commandfor={id} command="close">
					{m['HostBookingsPage.HostBookingsDetailsDialog.close']()}
				</Button>
			</div>
		</div>
	{/snippet}
</NativeDialog>
