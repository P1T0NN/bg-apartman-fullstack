<script lang="ts">
	// LIBRARIES
	import { api } from '@convex/_generated/api';
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import DataList from '@/components/ui/custom-components/data-list/data-list.svelte';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';
	import EmptyData from '@/components/ui/custom-components/empty-data/empty-data.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
	import NativeSelect from '@/components/ui/native-components/native-select/native-select.svelte';
	import AdminReviewsHeader from '@/components/pages/admin/reviews/admin-reviews-header.svelte';
	import AdminReviewSupport from '@/components/pages/admin/reviews/admin-review-support.svelte';
	import AdminReviewItem from '@/components/pages/admin/reviews/admin-review-item.svelte';
	import AdminReviewLoading from '@/components/pages/admin/reviews/loading/admin-review-loading.svelte';

	// HOOKS
	import { useConvexPagination } from '@/features/pagination/hooks/useConvexPagination.svelte.js';

	let status = $state('');
	const reviews = useConvexPagination(
		api.tables.reviews.queries.fetchReviewsAdmin.fetchReviewsAdmin,
		() => ({ filters: { status } }),
		{ pageSize: 10 }
	);
</script>

<SvelteHead title={m['AdminReviewsPage.pageTitle']()} noindex />

<div class="flex flex-col gap-6">
	<DataList pagination={reviews} key={(review) => review._id} class="gap-4">
		{#snippet header()}
			<AdminReviewsHeader />
			<AdminReviewSupport />
			<NativeSelect
				bind:value={status}
				label={m['AdminReviewsPage.status']()}
				placeholder={m['AdminReviewsPage.all']()}
				options={[
					{ value: '', label: m['AdminReviewsPage.all']() },
					{ value: 'published', label: m['AdminReviewsPage.AdminReviewItem.published']() },
					{ value: 'hidden', label: m['AdminReviewsPage.AdminReviewItem.hidden']() }
				]}
				class="w-full sm:max-w-xs"
			/>
		{/snippet}
		{#snippet children(review)}
			<AdminReviewItem {review} />
		{/snippet}

		{#snippet loadingSnippet()}
			<AdminReviewLoading />
		{/snippet}

		{#snippet errorSnippet()}
			<ErrorComponent message={m['ErrorMessages.loadFailed']()} />
		{/snippet}

		{#snippet empty()}
			<EmptyData title={m['AdminReviewsPage.empty']()} />
		{/snippet}
	</DataList>
</div>
