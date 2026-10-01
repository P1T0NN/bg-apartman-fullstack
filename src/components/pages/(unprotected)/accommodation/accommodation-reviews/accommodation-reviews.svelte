<script lang="ts">
	// LIBRARIES
	import { api } from '@convex/_generated/api';
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import DataList from '@/components/ui/custom-components/data-list/data-list.svelte';
	import EmptyData from '@/components/ui/custom-components/empty-data/empty-data.svelte';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';
	import AccommodationReviewsItem from './accommodation-reviews-item.svelte';
	import ReviewsLoading from '@/features/reviews/components/reviews/loading/reviews-loading.svelte';

	// CONFIG
	import { PAGINATION_CONFIG } from '@/shared/features/pagination/config.js';

	// HOOKS
	import { useConvexPagination } from '@/features/pagination/hooks/useConvexPagination.svelte.js';

	// TYPES
	import type { Id } from '@convex/_generated/dataModel';

	let {
		accommodationId,
		rating,
		expanded = false
	}: { accommodationId: Id<'accommodations'>; rating?: number; expanded?: boolean } = $props();

	const reviews = useConvexPagination(
		api.tables.reviews.queries.fetchAccommodationReviews.fetchAccommodationReviews,
		() => ({ accommodationId, rating }),
		{ pageSize: initialPageSize() }
	);

	// The parent recreates this component when switching between preview and full pagination.
	function initialPageSize() {
		return expanded
			? PAGINATION_CONFIG.DEFAULT_PAGE_SIZE
			: PAGINATION_CONFIG.DEFAULT_PREVIEW_PAGE_SIZE;
	}
</script>

<DataList
	pagination={reviews}
	total={rating === undefined ? reviews.total : null}
	showPagination={expanded}
	key={(review) => review._id}
	class="divide-y divide-border"
>
	{#snippet children(review)}
		<AccommodationReviewsItem {review} />
	{/snippet}

	{#snippet loadingSnippet()}
		<ReviewsLoading />
	{/snippet}

	{#snippet errorSnippet()}
		<ErrorComponent message={m['ErrorMessages.loadFailed']()} />
	{/snippet}

	{#snippet empty()}
		<EmptyData title={m['AccommodationPage.AccommodationReviews.noMatching']()} />
	{/snippet}
</DataList>
