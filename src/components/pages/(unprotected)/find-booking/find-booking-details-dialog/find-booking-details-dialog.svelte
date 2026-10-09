<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import NativeDialog from '@/components/ui/native-components/native-dialog/native-dialog.svelte';
	import FindBookingDetailsDialogHeader from './find-booking-details-dialog-header.svelte';
	import FindBookingDetailsDialogContent from './find-booking-details-dialog-content.svelte';

	// TYPES
	import type { Booking } from '@/shared/features/bookings/types/bookingTypes.js';

	let { booking }: { booking: Booking } = $props();

	const titleId = $props.id();
</script>

<NativeDialog aria-labelledby={titleId} class="max-w-[calc(100%-2rem)] sm:max-w-2xl">
	{#snippet trigger({ id })}
		<Button
			type="button"
			class="min-h-11 w-full sm:w-auto"
			commandfor={id}
			command="show-modal"
			aria-label={m['FindBookingPage.FindBookingDetailsDialog.viewLabel']({
				name: booking.accommodationName
			})}
		>
			{m['FindBookingPage.FindBookingDetailsDialog.view']()}
		</Button>
	{/snippet}

	{#snippet children({ id })}
		<div class="flex min-w-0 flex-col gap-6 p-4 sm:p-6">
			<div class="flex items-start justify-between gap-4">
				<FindBookingDetailsDialogHeader {booking} {titleId} />

				<Button type="button" variant="outline" class="min-h-11" commandfor={id} command="close">
					{m['FindBookingPage.FindBookingDetailsDialog.close']()}
				</Button>
			</div>

			<FindBookingDetailsDialogContent {booking} />
		</div>
	{/snippet}
</NativeDialog>
