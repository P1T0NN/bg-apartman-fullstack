<script lang="ts">
	// COMPONENTS
	import HostBookingsCancelButton from './host-bookings-cancel-button.svelte';
	import HostBookingsConfirmButton from './host-bookings-confirm-button.svelte';
	import HostBookingsCompleteButton from './host-bookings-complete-button.svelte';

	// TYPES
	import type { HostBookingItem } from '@/shared/features/bookings/types/bookingHostTypes.js';

	let { booking }: { booking: HostBookingItem } = $props();

	// Child dialogs keep their own pending state; the shared flag blocks the other actions meanwhile.
	let confirmPending = $state(false);
	let cancelPending = $state(false);
	let completePending = $state(false);
	const isBusy = $derived(confirmPending || cancelPending || completePending);
</script>

{#if booking.status === 'pending'}
	<HostBookingsConfirmButton {booking} disabled={isBusy} bind:pending={confirmPending} />
	<HostBookingsCancelButton {booking} disabled={isBusy} bind:pending={cancelPending} />
{:else if booking.status === 'confirmed'}
	<HostBookingsCompleteButton {booking} disabled={isBusy} bind:pending={completePending} />
	<HostBookingsCancelButton {booking} disabled={isBusy} bind:pending={cancelPending} />
{/if}
