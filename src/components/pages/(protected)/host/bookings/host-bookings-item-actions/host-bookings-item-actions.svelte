<script lang="ts">
	// COMPONENTS
	import HostBookingsCancelButton from './host-bookings-cancel-button.svelte';
	import HostBookingsConfirmButton from './host-bookings-confirm-button.svelte';
	import HostBookingsCompleteButton from './host-bookings-complete-button.svelte';
	import HostBookingsArchiveButton from './host-bookings-archive-button.svelte';

	// DATA
	import { BOOKING_ARCHIVABLE_STATUSES } from '@/shared/features/bookings/data/bookingsData.js';

	// TYPES
	import type { HostBookingItem } from '@/shared/features/bookings/types/bookingHostTypes.js';

	let { booking }: { booking: HostBookingItem } = $props();

	// Child dialogs keep their own pending state; the shared flag blocks the other actions meanwhile.
	let confirmPending = $state(false);
	let cancelPending = $state(false);
	let completePending = $state(false);
	let archivePending = $state(false);
	const isBusy = $derived(confirmPending || cancelPending || completePending || archivePending);
	const canArchive = $derived(BOOKING_ARCHIVABLE_STATUSES.includes(booking.status));
</script>

{#if booking.status === 'pending'}
	<HostBookingsConfirmButton {booking} disabled={isBusy} bind:pending={confirmPending} />
	<HostBookingsCancelButton {booking} disabled={isBusy} bind:pending={cancelPending} />
{:else if booking.status === 'confirmed'}
	<HostBookingsCompleteButton {booking} disabled={isBusy} bind:pending={completePending} />
	<HostBookingsCancelButton {booking} disabled={isBusy} bind:pending={cancelPending} />
{/if}

{#if canArchive}
	<HostBookingsArchiveButton {booking} disabled={isBusy} bind:pending={archivePending} />
{/if}
