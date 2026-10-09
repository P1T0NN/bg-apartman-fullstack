<script lang="ts">
	// LIBRARIES
	import { flushSync } from 'svelte';

	// CONVEX
	import { api } from '@convex/_generated/api.js';

	// COMPONENTS
	import NativeDialog from '@/components/ui/native-components/native-dialog/native-dialog.svelte';
	import AdminAccommodationsFeeDialogHeader from './admin-accommodations-fee-dialog-header.svelte';
	import AdminAccommodationsFeeDialogForm from './admin-accommodations-fee-dialog-form.svelte';

	// TYPES
	import type { FunctionReturnType } from 'convex/server';

	type Accommodation = FunctionReturnType<
		typeof api.tables.accommodations.queries.fetchAccommodationsAdmin.fetchAccommodationsAdmin
	>['items'][number];

	let { accommodation }: { accommodation: Accommodation } = $props();

	const titleId = $props.id();

	let pending = $state(false);

	let opening = $state(0);

	let dialog: NativeDialog;

	export function open() {
		dialog?.open();
	}
</script>

<NativeDialog
	bind:this={dialog}
	aria-labelledby={titleId}
	onbeforetoggle={(event) => {
		if (event.newState === 'open')
			flushSync(() => {
				opening += 1;
			});
	}}
>
	{#snippet children({ id, close })}
		<div class="flex flex-col gap-5 p-6">
			<AdminAccommodationsFeeDialogHeader id={titleId} name={accommodation.name} />

			{#key opening}
				<AdminAccommodationsFeeDialogForm {accommodation} dialogId={id} {close} bind:pending />
			{/key}
		</div>
	{/snippet}
</NativeDialog>
