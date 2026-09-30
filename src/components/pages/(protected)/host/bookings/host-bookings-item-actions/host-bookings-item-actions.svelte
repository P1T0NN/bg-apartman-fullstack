<script lang="ts">
	// LIBRARIES
	import { useMutation } from 'convex-svelte';

	// CONVEX
	import { api } from '@convex/_generated/api';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import { Spinner } from '@/components/ui/spinner/index.js';
	import HostBookingsCancelButton from './host-bookings-cancel-button.svelte';
	import HostBookingsConfirmButton from './host-bookings-confirm-button.svelte';
	import { m } from '@/lib/paraglide/messages';

	// UTILS
	import { toastMessage } from '@/utils/toastMessage.js';

	// TYPES
	import type { HostBookingItem } from '@/shared/features/bookings/types/bookingHostTypes.js';

	let { booking }: { booking: HostBookingItem } = $props();

	const updateBookingStatus = useMutation(
		api.tables.bookings.mutations.updateBookingStatus.updateBookingStatus
	);

	// Child dialogs keep their own pending state; the shared flag blocks the other actions meanwhile.
	let confirmPending = $state(false);
	let cancelPending = $state(false);
	let completePending = $state(false);
	const isBusy = $derived(confirmPending || cancelPending || completePending);

	async function complete(): Promise<void> {
		completePending = true;
		try {
			await updateBookingStatus({ id: booking._id, status: 'completed' });
			toastMessage({
				type: 'success',
				message: m['HostBookingsPage.HostBookingsItemActions.toastCompleted']()
			});
		} catch (error) {
			toastMessage({ type: 'error', error, message: m['ErrorMessages.unexpected']() });
		} finally {
			completePending = false;
		}
	}
</script>

{#if booking.status === 'pending'}
	<HostBookingsConfirmButton {booking} disabled={isBusy} bind:pending={confirmPending} />
	<HostBookingsCancelButton {booking} disabled={isBusy} bind:pending={cancelPending} />
{:else if booking.status === 'confirmed'}
	<Button variant="outline" size="sm" disabled={isBusy} onclick={() => void complete()}>
		{#if completePending}<Spinner data-icon="inline-start" />{/if}
		{m['HostBookingsPage.HostBookingsItemActions.complete']()}
	</Button>
	<HostBookingsCancelButton {booking} disabled={isBusy} bind:pending={cancelPending} />
{/if}
