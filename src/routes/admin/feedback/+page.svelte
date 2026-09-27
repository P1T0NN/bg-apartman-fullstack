<script lang="ts">
	// LIBRARIES
	import { api } from '@convex/_generated/api';
	import { m } from '@/lib/paraglide/messages';

	// CONFIG
	import { PAGINATION_CONFIG } from '@/shared/features/pagination/config';

	// COMPONENTS
	import AdminFeedbackHeader from '@/components/pages/admin/feedback/admin-feedback-header.svelte';
	import AdminFeedbackTableItem from '@/components/pages/admin/feedback/admin-feedback-table-item.svelte';
	import AdminFeedbackTableLoading from '@/components/pages/admin/feedback/loading/admin-feedback-table-loading.svelte';
	import DataTable from '@/components/ui/custom-components/data-table/data-table.svelte';
	import EmptyData from '@/components/ui/custom-components/empty-data/empty-data.svelte';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
	import { TableHead } from '@/components/ui/table';
	import SearchInput from '@/features/search/components/search-input.svelte';
	import NativeSelect from '@/components/ui/native-components/native-select/native-select.svelte';
	import { Button } from '@/components/ui/button';

	// HOOKS
	import { useConvexPagination } from '@/features/pagination/hooks/useConvexPagination.svelte.js';
	import { useSearch } from '@/features/search/hooks/useSearch.svelte';
	import { useFilters } from '@/features/filters/hooks/useFilters.svelte';

	// DATA
	import { FEEDBACK_FILTER_DEFS } from '@/features/filters/data/feedbackFilterDefs.js';

	const search = useSearch({ mode: 'state' });
	const filters = useFilters({ mode: 'state', defs: FEEDBACK_FILTER_DEFS });

	const feedbacks = useConvexPagination(
		api.tables.feedbacks.queries.fetchFeedbacksAdmin.fetchFeedbacksAdmin,
		() => ({
			search: search.term || undefined,
			filters: filters.active
		}),
		{
			pageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
			resetKey: () => [search.term, filters.identity]
		}
	);

	const total = $derived(feedbacks.total ?? null);
	const paginationTotal = $derived(search.isActive || filters.isActive ? null : total);
	const isFiltering = $derived(search.isActive || filters.isActive);
</script>

<SvelteHead title={m['AdminFeedbackPage.pageTitle']()} noindex />

<div class="flex min-h-full min-w-0 flex-1 flex-col gap-6">
	<DataTable
		pagination={feedbacks}
		total={paginationTotal}
		key={(feedback) => feedback._id}
		placement="above"
	>
		{#snippet header()}
			<div class="flex flex-col gap-4">
				<AdminFeedbackHeader {total} showTotal={!isFiltering} />

				<div class="flex flex-wrap items-center gap-2">
					<SearchInput
						bind:value={search.value}
						placeholder={m['AdminFeedbackPage.searchPlaceholder']()}
						class="w-full sm:max-w-sm"
					/>

					{#each filters.defs as def (def.key)}
						<NativeSelect
							options={def.options}
							value={filters.value(def.key)}
							placeholder={def.label}
							label={def.label}
							onchange={(value) => filters.set(def.key, value)}
						/>
					{/each}

					{#if filters.isActive}
						<Button variant="outline" size="sm" onclick={filters.clearAll}>
							{m['AdminFeedbackPage.clearFilters']({ count: filters.count })}
						</Button>
					{/if}
				</div>
			</div>
		{/snippet}

		{#snippet head()}
			<TableHead class="min-w-48">{m['AdminFeedbackPage.fromColumn']()}</TableHead>
			<TableHead class="min-w-72">{m['AdminFeedbackPage.feedbackColumn']()}</TableHead>
			<TableHead>{m['AdminFeedbackPage.categoryColumn']()}</TableHead>
			<TableHead>{m['AdminFeedbackPage.typeColumn']()}</TableHead>
			<TableHead>{m['AdminFeedbackPage.submittedColumn']()}</TableHead>
			<TableHead>{m['AdminFeedbackPage.actionColumn']()}</TableHead>
		{/snippet}

		{#snippet row(feedback)}
			<AdminFeedbackTableItem {feedback} />
		{/snippet}

		{#snippet loadingSnippet()}
			<AdminFeedbackTableLoading />
		{/snippet}

		{#snippet errorSnippet()}
			<ErrorComponent message={m['ErrorMessages.loadFailed']()} />
		{/snippet}

		{#snippet empty()}
			<EmptyData
				title={isFiltering ? m['AdminFeedbackPage.noMatching']() : m['AdminFeedbackPage.noneYet']()}
				description={search.isActive
					? m['AdminFeedbackPage.searchEmptyDescription']({ term: search.term })
					: filters.isActive
						? m['AdminFeedbackPage.filtersEmptyDescription']()
						: m['AdminFeedbackPage.emptyDescription']()}
			>
				{#snippet icon()}
					<span
						class={isFiltering
							? 'icon-[lucide--search] size-5'
							: 'icon-[lucide--message-square-text] size-5'}
						aria-hidden="true"
					></span>
				{/snippet}
			</EmptyData>
		{/snippet}
	</DataTable>
</div>
