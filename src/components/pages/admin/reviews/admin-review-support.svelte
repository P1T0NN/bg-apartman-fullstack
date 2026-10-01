<script lang="ts">
	// LIBRARIES
	import { api } from '@convex/_generated/api';
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import Form from '@/components/ui/custom-components/form/form.svelte';
	import { Button } from '@/components/ui/button/index.js';
	import { Spinner } from '@/components/ui/spinner/index.js';

	// SCHEMAS
	import { completeBookingAdminSchema } from '@/shared/features/bookings/schemas/bookingSchemas.js';

	// TYPES
	import type { FieldConfig } from '@/components/ui/custom-components/form/formTypes.js';

	let submitting = $state(false);
	let disclosure: HTMLDetailsElement;
	function attachDisclosure(element: HTMLDetailsElement) {
		disclosure = element;
	}
	const fields = $derived<FieldConfig[]>([
		{
			kind: 'input',
			name: 'bookingId',
			label: m['AdminReviewsPage.AdminReviewSupport.bookingId'](),
			required: true
		},
		{
			kind: 'textarea',
			name: 'reason',
			label: m['AdminReviewsPage.AdminReviewSupport.reason'](),
			required: true,
			rows: 3
		}
	]);
</script>

<details {@attach attachDisclosure} class="rounded-xl border p-5">
	<summary
		class="min-h-6 cursor-pointer text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
	>
		{m['AdminReviewsPage.AdminReviewSupport.title']()}
	</summary>
	<p class="my-4 max-w-prose text-sm text-muted-foreground">
		{m['AdminReviewsPage.AdminReviewSupport.description']()}
	</p>
	<Form
		function={api.tables.bookings.mutations.completeBookingAdmin.completeBookingAdmin}
		schema={completeBookingAdminSchema}
		{fields}
		bind:submitting
		onSuccess={() => {
			disclosure.open = false;
		}}
	>
		<Button type="submit" disabled={submitting} class="w-fit">
			{#if submitting}
				<Spinner data-icon="inline-start" />
			{/if}
			{m['AdminReviewsPage.AdminReviewSupport.submit']()}
		</Button>
	</Form>
</details>
