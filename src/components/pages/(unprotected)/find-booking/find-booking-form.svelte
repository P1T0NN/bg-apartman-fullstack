<script lang="ts">
	// LIBRARIES
	import { api } from '@convex/_generated/api';
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime';

	// COMPONENTS
	import Form from '@/components/ui/custom-components/form/form.svelte';
	import { Button } from '@/components/ui/button/index.js';
	import { Spinner } from '@/components/ui/spinner/index.js';

	// SCHEMAS
	import { requestBookingRecoveryLinkSchema } from '@/shared/features/bookingsRecoveryTokens/schemas/bookingRecoveryTokenSchemas.js';

	// TYPES
	import type { FieldConfig } from '@/components/ui/custom-components/form/formTypes.js';

	let submitting = $state(false);
	let requestAcknowledged = $state(false);

	const fields = $derived<FieldConfig[]>([
		{
			kind: 'input',
			name: 'email',
			type: 'email',
			label: m['FindBookingPage.FindBookingForm.email'](),
			description: m['FindBookingPage.FindBookingForm.emailHint'](),
			placeholder: m['FindBookingPage.FindBookingForm.emailPlaceholder'](),
			autocomplete: 'email',
			inputmode: 'email',
			maxLength: 254,
			required: true
		}
	]);
</script>

<Form
	function={api.tables.bookingRecoveryTokens.actions.requestBookingRecoveryLink
		.requestBookingRecoveryLink}
	functionType="action"
	schema={requestBookingRecoveryLinkSchema}
	{fields}
	extraFields={{ locale: getLocale() }}
	bind:submitting
	resetOnSuccess={false}
	successMessage={m['FindBookingPage.requestAcknowledged']()}
	onSuccess={() => {
		requestAcknowledged = true;
	}}
	oninput={() => {
		requestAcknowledged = false;
	}}
>
	<Button type="submit" disabled={submitting} class="min-h-11 w-full">
		{#if submitting}
			<Spinner data-icon="inline-start" aria-hidden="true" />
		{/if}

		{submitting
			? m['FindBookingPage.FindBookingForm.submitting']()
			: m['FindBookingPage.FindBookingForm.submit']()}
	</Button>
</Form>

<div role="status">
	{#if requestAcknowledged}
		<div
			class="mt-6 flex flex-col gap-1 rounded-lg border border-success/30 bg-success/10 p-4 text-sm leading-6 text-success"
		>
			<p class="font-semibold">{m['FindBookingPage.FindBookingForm.checkInbox']()}</p>
			<p>{m['FindBookingPage.requestAcknowledged']()}</p>
		</div>
		<p class="mt-3 text-sm leading-6 text-muted-foreground">
			{m['FindBookingPage.FindBookingForm.inboxHint']()}
		</p>
	{/if}
</div>
