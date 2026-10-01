<script lang="ts">
	// LIBRARIES
	import { api } from '@convex/_generated/api';
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import Form from '@/components/ui/custom-components/form/form.svelte';
	import { Button } from '@/components/ui/button/index.js';
	import { Spinner } from '@/components/ui/spinner/index.js';
	import ReviewDialogRating from './review-dialog-rating.svelte';

	// SCHEMAS
	import { createReviewSchema } from '@/shared/features/reviews/schemas/reviewSchemas.js';

	// TYPES
	import type { Id } from '@convex/_generated/dataModel';
	import type {
		CustomFieldContext,
		FieldConfig,
		MutationValues
	} from '@/components/ui/custom-components/form/formTypes.js';

	let {
		bookingId,
		submitting = $bindable(false),
		onSuccess
	}: {
		bookingId: Id<'bookings'>;
		submitting?: boolean;
		onSuccess: () => void;
	} = $props();

	let values = $state<
		MutationValues<typeof api.tables.reviews.mutations.createReview.createReview>
	>({ rating: undefined, comment: '' });

	const fields = $derived<FieldConfig[]>([
		{
			kind: 'custom',
			name: 'rating',
			required: true,
			render: ratingControl
		},
		{
			kind: 'textarea',
			name: 'comment',
			label: m['ReviewsFeature.ReviewDialogForm.comment'](),
			description: m['ReviewsFeature.ReviewDialogForm.commentHint'](),
			required: true,
			rows: 6
		}
	]);
</script>

{#snippet ratingControl(context: CustomFieldContext)}
	<ReviewDialogRating {context} />
{/snippet}

<Form
	function={api.tables.reviews.mutations.createReview.createReview}
	schema={createReviewSchema}
	{fields}
	extraFields={{ bookingId }}
	bind:values
	bind:submitting
	{onSuccess}
	resetOnSuccess={false}
	successMessage={m['ReviewsFeature.ReviewDialogForm.published']()}
>
	<details class="rounded-lg border p-4">
		<summary
			class="min-h-6 cursor-pointer text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
		>
			{m['ReviewsFeature.ReviewDialogForm.preview']()}
		</summary>
		<p class="mt-4 text-sm font-medium">
			{values.rating
				? m['ReviewsFeature.ReviewDialogRating.stars']({ rating: Number(values.rating) })
				: m['ReviewsFeature.ReviewDialogForm.chooseRating']()}
		</p>
		<p class="mt-2 max-w-[70ch] text-sm leading-6 wrap-anywhere whitespace-pre-line">
			{String(values.comment ?? '').trim() || m['ReviewsFeature.ReviewDialogForm.previewEmpty']()}
		</p>
	</details>
	<p class="text-sm text-muted-foreground">
		{m['ReviewsFeature.ReviewDialogForm.immutable']()}
	</p>
	<Button type="submit" disabled={submitting} class="min-h-11 w-full sm:w-fit">
		{#if submitting}
			<Spinner data-icon="inline-start" />
		{/if}
		{m['ReviewsFeature.ReviewDialogForm.publish']()}
	</Button>
</Form>
