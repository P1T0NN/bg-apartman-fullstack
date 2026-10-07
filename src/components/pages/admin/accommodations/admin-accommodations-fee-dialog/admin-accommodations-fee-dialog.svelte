<script lang="ts">
	// LIBRARIES
	import { flushSync } from 'svelte';
	import { m } from '@/lib/paraglide/messages.js';

	// COMPONENTS
	import NativeDialog from '@/components/ui/native-components/native-dialog/native-dialog.svelte';
	import { Button } from '@/components/ui/button/index.js';
	import AdminAccommodationsFeeDialogHeader from './admin-accommodations-fee-dialog-header.svelte';
	import AdminAccommodationsFeeDialogForm from './admin-accommodations-fee-dialog-form.svelte';

	// TYPES
	import type { AdminAccommodationsFeeDialogAccommodation } from './adminAccommodationsFeeDialogTypes.js';

	let { accommodation }: { accommodation: AdminAccommodationsFeeDialogAccommodation } = $props();

	const titleId = $props.id();

	let pending = $state(false);

	let opening = $state(0);
</script>

<NativeDialog
	aria-labelledby={titleId}
	onbeforetoggle={(event) => {
		if (event.newState === 'open')
			flushSync(() => {
				opening += 1;
			});
	}}
>
	{#snippet trigger({ id })}
		<Button
			variant="outline"
			size="sm"
			disabled={pending || accommodation.status === 'deleted'}
			commandfor={id}
			command="show-modal"
		>
			{m['AdminAccommodationsPage.AdminAccommodationsFeeDialog.trigger']()}
		</Button>
	{/snippet}

	{#snippet children({ id, close })}
		<div class="flex flex-col gap-5 p-6">
			<AdminAccommodationsFeeDialogHeader id={titleId} name={accommodation.name} />
			
			{#key opening}
				<AdminAccommodationsFeeDialogForm {accommodation} dialogId={id} {close} bind:pending />
			{/key}
		</div>
	{/snippet}
</NativeDialog>
