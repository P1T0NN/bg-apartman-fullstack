<script lang="ts">
	// LIBRARIES
	import { useMutation } from 'convex-svelte';
	import { api } from '@convex/_generated/api';
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import { Spinner } from '@/components/ui/spinner/index.js';
	import NativeDialog from '@/components/ui/native-components/native-dialog/native-dialog.svelte';

	// UTILS
	import { toastMessage } from '@/utils/toastMessage.js';

	// TYPES
	import type { HostBookingItem } from '@/shared/features/bookings/types/bookingHostTypes.js';

	let {
		booking,
		disabled = false,
		pending = $bindable(false)
	}: { booking: HostBookingItem; disabled?: boolean; pending?: boolean } = $props();
	const update = useMutation(api.tables.bookings.mutations.updateBookingStatus.updateBookingStatus);
	const dialogId = $derived(`complete-booking-${booking._id}`);
	async function complete(close: () => void) {
		pending = true;
		try {
			await update({ id: booking._id, status: 'completed' });
			toastMessage({
				type: 'success',
				message: m['HostBookingsPage.HostBookingsItemActions.toastCompleted']()
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
			{m['HostBookingsPage.HostBookingsItemActions.complete']()}
		</Button>
	{/snippet}
	{#snippet children({ id, close })}
		<div class="flex flex-col gap-5 p-4 sm:p-6">
			<h2 id={dialogId} class="text-lg font-semibold">
				{m['HostBookingsPage.HostBookingsCompleteButton.title']()}
			</h2>
			<p class="text-sm text-muted-foreground">
				{m['HostBookingsPage.HostBookingsCompleteButton.description']()}
			</p>
			<div class="flex flex-wrap justify-end gap-2">
				<Button variant="outline" disabled={pending} commandfor={id} command="close">
					{m['HostBookingsPage.HostBookingsCompleteButton.cancel']()}
				</Button>
				<Button disabled={pending} onclick={() => void complete(close)}>
					{#if pending}
						<Spinner data-icon="inline-start" />
					{/if}
					{m['HostBookingsPage.HostBookingsItemActions.complete']()}
				</Button>
			</div>
		</div>
	{/snippet}
</NativeDialog>
