<script lang="ts">
	// LIBRARIES
	import { useQuery } from 'convex-svelte';
	import { api } from '@convex/_generated/api';
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import NativeDialog from '@/components/ui/native-components/native-dialog/native-dialog.svelte';
	import { Button } from '@/components/ui/button/index.js';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';
	import EmptyData from '@/components/ui/custom-components/empty-data/empty-data.svelte';
	import MyReviewDetailsDialogHeader from './my-review-details-dialog-header.svelte';
	import MyReviewDetailsDialogContent from './my-review-details-dialog-content.svelte';
	import MyReviewDetailsDialogLoading from '../loading/my-review-details-dialog-loading.svelte';

	// TYPES
	import type { Id } from '@convex/_generated/dataModel';
	import type { MyReview } from '@/shared/features/reviews/types/reviewTypes.js';
	import type { Snippet } from 'svelte';

	let {
		reviewId,
		review,
		trigger: customTrigger
	}: {
		reviewId: Id<'reviews'>;
		review?: MyReview;
		trigger?: Snippet<[{ id: string }]>;
	} = $props();

	const titleId = $props.id();

	let active = $state(false);

	const result = useQuery(api.tables.reviews.queries.fetchMyReview.fetchMyReview, () =>
		active && !review ? { id: reviewId } : 'skip'
	);
	
	const details = $derived(review ?? result.data);
</script>

<NativeDialog
	aria-labelledby={titleId}
	class="max-w-[calc(100%-2rem)] sm:max-w-2xl"
	onbeforetoggle={(event) => {
		if (event.newState === 'open') active = true;
	}}
	onclose={() => (active = false)}
>
	{#snippet trigger({ id })}
		{#if customTrigger}
			{@render customTrigger({ id })}
		{:else}
			<Button
				commandfor={id}
				command="show-modal"
				variant="outline"
				class="min-h-11 w-full sm:w-auto"
			>
				{m['MyReviewsPage.MyReviewDetailsDialog.view']()}
			</Button>
		{/if}
	{/snippet}

	{#snippet children({ id })}
		<div class="flex flex-col gap-5 p-4 sm:p-6">
			<div class="flex items-start justify-between gap-4">
				<h2 id={titleId} class="text-xl font-semibold">
					{m['MyReviewsPage.MyReviewDetailsDialog.title']()}
				</h2>

				<Button commandfor={id} command="close" variant="outline" class="min-h-11">
					{m['MyReviewsPage.MyReviewDetailsDialog.close']()}
				</Button>
			</div>

			{#if active}
				{#if details}
					<MyReviewDetailsDialogHeader review={details} />
					<MyReviewDetailsDialogContent review={details} />
				{:else if result.error}
					<ErrorComponent message={m['ErrorMessages.loadFailed']()} />
				{:else if result.isLoading}
					<MyReviewDetailsDialogLoading />
				{:else}
					<EmptyData
						title={m['MyReviewsPage.MyReviewDetailsDialog.notFoundTitle']()}
						description={m['MyReviewsPage.MyReviewDetailsDialog.notFoundDescription']()}
					/>
				{/if}
			{/if}
		</div>
	{/snippet}
</NativeDialog>
