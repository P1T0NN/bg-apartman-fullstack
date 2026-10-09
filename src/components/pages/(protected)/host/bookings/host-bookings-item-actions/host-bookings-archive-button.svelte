<script lang="ts">
	// LIBRARIES
	import { useMutation } from 'convex-svelte';
	import { m } from '@/lib/paraglide/messages';

	// CONVEX
	import { api } from '@convex/_generated/api';

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

	const archiveBooking = useMutation(api.tables.bookings.mutations.archiveBooking.archiveBooking);
	const dialogId = $derived(`archive-booking-${booking._id}`);

	async function archive(close: () => void): Promise<void> {
		if (disabled || pending) return;
		pending = true;
		try {
			await archiveBooking({ id: booking._id });
			toastMessage({
				type: 'success',
				message: m['HostBookingsPage.HostBookingsArchiveButton.toastArchived']()
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
			type="button"
			size="sm"
			class="bg-blue-600 text-white hover:bg-blue-700 focus-visible:border-blue-600 focus-visible:ring-blue-600/30"
			disabled={disabled || pending}
			commandfor={id}
			command="show-modal"
		>
			<span class="icon-[lucide--archive] size-4" aria-hidden="true"></span>
			{m['HostBookingsPage.HostBookingsArchiveButton.archive']()}
		</Button>
	{/snippet}
	{#snippet children({ id, close })}
		<div class="flex min-w-0 flex-col gap-5 p-4 sm:p-6">
			<h2 id={dialogId} class="text-lg font-semibold">
				{m['HostBookingsPage.HostBookingsArchiveButton.title']()}
			</h2>
			<p class="text-sm text-muted-foreground">
				{m['HostBookingsPage.HostBookingsArchiveButton.description']()}
			</p>
			<div class="flex flex-wrap justify-end gap-2">
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={pending}
					commandfor={id}
					command="close"
				>
					{m['HostBookingsPage.HostBookingsArchiveButton.keep']()}
				</Button>
				<Button
					type="button"
					size="sm"
						class="bg-blue-600 text-white hover:bg-blue-700 focus-visible:border-blue-600 focus-visible:ring-blue-600/30"
					disabled={disabled || pending}
					onclick={() => void archive(close)}
				>
					{#if pending}
						<Spinner data-icon="inline-start" />
					{/if}
					{m['HostBookingsPage.HostBookingsArchiveButton.archive']()}
				</Button>
			</div>
		</div>
	{/snippet}
</NativeDialog>
