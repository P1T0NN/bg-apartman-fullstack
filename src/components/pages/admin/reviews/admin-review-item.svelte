<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	import { api } from '@convex/_generated/api';

	// COMPONENTS
	import Form from '@/components/ui/custom-components/form/form.svelte';
	import { Button } from '@/components/ui/button/index.js';
	import { Badge } from '@/components/ui/badge/index.js';
	import { Spinner } from '@/components/ui/spinner/index.js';
	import * as Card from '@/components/ui/card/index.js';
	import AccommodationReviewsItem from '@/components/pages/(unprotected)/accommodation/accommodation-reviews/accommodation-reviews-item.svelte';

	// SCHEMAS
	import { updateReviewVisibilitySchema } from '@/shared/features/reviews/schemas/reviewSchemas.js';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// TYPES
	import type { Doc } from '@convex/_generated/dataModel';
	import type { FieldConfig } from '@/components/ui/custom-components/form/formTypes.js';

	let { review }: { review: Doc<'reviews'> & { accommodationName: string | null } } = $props();
	let submitting = $state(false);
	let disclosure: HTMLDetailsElement;
	function attachDisclosure(element: HTMLDetailsElement) {
		disclosure = element;
	}
	const fields = $derived<FieldConfig[]>([
		{
			kind: 'textarea',
			name: 'reason',
			label: m['AdminReviewsPage.AdminReviewItem.reason'](),
			required: true,
			rows: 3
		}
	]);
	const nextStatus = $derived(review.status === 'published' ? 'hidden' : 'published');
</script>

<Card.Root class="text-base">
	<Card.Content>
		<div class="flex flex-wrap items-center justify-between gap-3">
			<Button
				href={`${UNPROTECTED_PAGE_ENDPOINTS.ACCOMMODATION(review.accommodationId)}#reviews`}
				variant="outline"
			>
				{review.accommodationName ?? m['AdminReviewsPage.AdminReviewItem.unavailable']()}
			</Button>
			<Badge variant="secondary">
				{review.status === 'hidden'
					? m['AdminReviewsPage.AdminReviewItem.hidden']()
					: m['AdminReviewsPage.AdminReviewItem.published']()}
			</Badge>
		</div>
		<AccommodationReviewsItem {review} />
		{#if review.moderationReason}
			<p class="mb-4 text-sm text-muted-foreground">
				{m['AdminReviewsPage.AdminReviewItem.lastReason']({ reason: review.moderationReason })}
			</p>
		{/if}
		<details {@attach attachDisclosure}>
			<summary
				class="min-h-11 cursor-pointer rounded-sm py-3 text-sm font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
			>
				{nextStatus === 'hidden'
					? m['AdminReviewsPage.AdminReviewItem.hide']()
					: m['AdminReviewsPage.AdminReviewItem.restore']()}
			</summary>
			<Form
				function={api.tables.reviews.mutations.updateReviewVisibility.updateReviewVisibility}
				schema={updateReviewVisibilitySchema}
				{fields}
				extraFields={{ id: review._id, status: nextStatus }}
				bind:submitting
				onSuccess={() => {
					disclosure.open = false;
				}}
			>
				<Button
					type="submit"
					variant={nextStatus === 'hidden' ? 'destructive' : 'default'}
					disabled={submitting}
					class="w-fit"
				>
					{#if submitting}
						<Spinner data-icon="inline-start" />
					{/if}
					{nextStatus === 'hidden'
						? m['AdminReviewsPage.AdminReviewItem.hide']()
						: m['AdminReviewsPage.AdminReviewItem.restore']()}
				</Button>
			</Form>
		</details>
	</Card.Content>
</Card.Root>
