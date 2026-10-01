<script lang="ts">
	// LIBRARIES
	import { api } from '@convex/_generated/api';
	import { m } from '@/lib/paraglide/messages';

	// CONFIG
	import { PAGINATION_CONFIG } from '@/shared/features/pagination/config';

	// COMPONENTS
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
	import DataList from '@/components/ui/custom-components/data-list/data-list.svelte';
	import EmptyData from '@/components/ui/custom-components/empty-data/empty-data.svelte';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';
	import MyReviewsHeader from '@/components/pages/(protected)/guest/my-reviews/my-reviews-header.svelte';
	import MyReviewItem from '@/components/pages/(protected)/guest/my-reviews/my-review-item.svelte';
	import MyReviewItemLoading from '@/components/pages/(protected)/guest/my-reviews/loading/my-review-item-loading.svelte';

	// HOOKS
	import { useConvexPagination } from '@/features/pagination/hooks/useConvexPagination.svelte.js';

	// CONFIG
	import { PROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	const reviews = useConvexPagination(
		api.tables.reviews.queries.fetchMyReviews.fetchMyReviews,
		() => ({}),
		{ pageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE }
	);
</script>

<SvelteHead title={m['MyReviewsPage.pageTitle']()} noindex />

<div class="flex w-full flex-col gap-6">
	<DataList pagination={reviews} key={(review) => review._id}>
		{#snippet header()}
			<MyReviewsHeader />
		{/snippet}

		{#snippet children(review)}
			<MyReviewItem {review} />
		{/snippet}

		{#snippet loadingSnippet()}
			<MyReviewItemLoading />
		{/snippet}

		{#snippet errorSnippet()}
			<ErrorComponent message={m['ErrorMessages.loadFailed']()} />
		{/snippet}

		{#snippet empty()}
			<EmptyData
				title={m['MyReviewsPage.emptyTitle']()}
				description={m['MyReviewsPage.emptyDescription']()}
				action={{
					label: m['MyReviewsPage.viewBookings'](),
					href: PROTECTED_PAGE_ENDPOINTS.MY_BOOKINGS
				}}
			>
				{#snippet icon()}
					<span class="icon-[lucide--message-square] size-5" aria-hidden="true"></span>
				{/snippet}
			</EmptyData>
		{/snippet}
	</DataList>
</div>
