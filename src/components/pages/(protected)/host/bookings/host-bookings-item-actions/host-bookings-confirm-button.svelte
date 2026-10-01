<script lang="ts">
	// LIBRARIES
	import { useMutation } from 'convex-svelte';

	// CONVEX
	import { api } from '@convex/_generated/api';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import NativeDialog from '@/components/ui/native-components/native-dialog/native-dialog.svelte';
	import { Spinner } from '@/components/ui/spinner/index.js';
	import { m } from '@/lib/paraglide/messages';

	// UTILS
	import { formatFullName } from '@/shared/utils/formatFullName.js';
	import { toastMessage } from '@/utils/toastMessage.js';

	// TYPES
	import type { HostBookingItem } from '@/shared/features/bookings/types/bookingHostTypes.js';

	let {
		booking,
		disabled = false,
		pending = $bindable(false)
	}: {
		booking: HostBookingItem;
		disabled?: boolean;
		pending?: boolean;
	} = $props();

	const updateBookingStatus = useMutation(
		api.tables.bookings.mutations.updateBookingStatus.updateBookingStatus
	);

	const guestName = $derived(formatFullName(booking.firstName, booking.lastName));
	const dialogId = $derived(`confirm-booking-${booking._id}`);

	async function confirm(close: () => void): Promise<void> {
		pending = true;
		try {
			await updateBookingStatus({ id: booking._id, status: 'confirmed' });
			toastMessage({
				type: 'success',
				message: m['HostBookingsPage.HostBookingsConfirmButton.toastConfirmed']()
			});
			close();
		} catch (error) {
			toastMessage({ type: 'error', error, message: m['ErrorMessages.unexpected']() });
		} finally {
			pending = false;
		}
	}
</script>

<NativeDialog aria-labelledby={dialogId}>
	{#snippet trigger({ id })}
		<Button
			variant="success"
			size="sm"
			disabled={disabled || pending}
			commandfor={id}
			command="show-modal"
		>
			{m['HostBookingsPage.HostBookingsConfirmButton.confirm']()}
		</Button>
	{/snippet}

	{#snippet children({ id, close })}
		<div class="flex min-w-0 flex-col gap-5 p-4 sm:p-6">
			<div class="flex flex-col gap-1.5">
				<h2 id={dialogId} class="text-lg font-semibold break-words">
					{m['HostBookingsPage.HostBookingsConfirmButton.confirmTitle']({ name: guestName })}
				</h2>
				<p class="text-sm text-muted-foreground">
					{m['HostBookingsPage.HostBookingsConfirmButton.confirmDescription']()}
				</p>
			</div>

			<div class="flex flex-wrap justify-end gap-2">
				<Button variant="outline" size="sm" disabled={pending} commandfor={id} command="close">
					{m['HostBookingsPage.HostBookingsConfirmButton.keep']()}
				</Button>
				<Button variant="success" size="sm" disabled={pending} onclick={() => void confirm(close)}>
					{#if pending}
						<Spinner data-icon="inline-start" />
					{/if}
					{m['HostBookingsPage.HostBookingsConfirmButton.confirmSubmit']()}
				</Button>
			</div>
		</div>
	{/snippet}
</NativeDialog>
