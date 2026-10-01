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

	// A pending request is declined; a confirmed stay is cancelled.
	const isDecline = $derived(booking.status === 'pending');
	const targetStatus = $derived(isDecline ? ('declined' as const) : ('cancelled' as const));
	const guestName = $derived(formatFullName(booking.firstName, booking.lastName));
	const dialogId = $derived(`${isDecline ? 'decline' : 'cancel'}-booking-${booking._id}`);

	async function update(close: () => void): Promise<void> {
		pending = true;
		try {
			await updateBookingStatus({ id: booking._id, status: targetStatus });
			toastMessage({
				type: 'success',
				message: isDecline
					? m['HostBookingsPage.HostBookingsCancelButton.toastDeclined']()
					: m['HostBookingsPage.HostBookingsCancelButton.toastCancelled']()
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
			variant="outline"
			size="sm"
			disabled={disabled || pending}
			commandfor={id}
			command="show-modal"
		>
			{isDecline
				? m['HostBookingsPage.HostBookingsCancelButton.decline']()
				: m['HostBookingsPage.HostBookingsCancelButton.cancel']()}
		</Button>
	{/snippet}

	{#snippet children({ id, close })}
		<div class="flex min-w-0 flex-col gap-5 p-4 sm:p-6">
			<div class="flex flex-col gap-1.5">
				<h2 id={dialogId} class="text-lg font-semibold break-words">
					{isDecline
						? m['HostBookingsPage.HostBookingsCancelButton.declineTitle']({ name: guestName })
						: m['HostBookingsPage.HostBookingsCancelButton.cancelTitle']({ name: guestName })}
				</h2>
				<p class="text-sm text-muted-foreground">
					{isDecline
						? m['HostBookingsPage.HostBookingsCancelButton.declineDescription']()
						: m['HostBookingsPage.HostBookingsCancelButton.cancelDescription']()}
				</p>
			</div>

			<div class="flex flex-wrap justify-end gap-2">
				<Button variant="outline" size="sm" disabled={pending} commandfor={id} command="close">
					{m['HostBookingsPage.HostBookingsCancelButton.keep']()}
				</Button>
				<Button
					variant="destructive"
					size="sm"
					disabled={pending}
					onclick={() => void update(close)}
				>
					{#if pending}
						<Spinner data-icon="inline-start" />
					{/if}
					{isDecline
						? m['HostBookingsPage.HostBookingsCancelButton.decline']()
						: m['HostBookingsPage.HostBookingsCancelButton.cancel']()}
				</Button>
			</div>
		</div>
	{/snippet}
</NativeDialog>
