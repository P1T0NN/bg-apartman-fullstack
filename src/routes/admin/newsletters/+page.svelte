<script lang="ts">
	// CONVEX
	import { api } from '@convex/_generated/api';

	// CONFIG
	import { PAGINATION_CONFIG } from '@/shared/features/pagination/config.js';

	// COMPONENTS
	import AdminNewslettersHeader from '@/components/pages/admin/newsletters/admin-newsletters-header.svelte';
	import AdminNewslettersTableItem from '@/components/pages/admin/newsletters/admin-newsletters-table-item.svelte';
	import AdminNewslettersTableLoading from '@/components/pages/admin/newsletters/loading/admin-newsletters-table-loading.svelte';
	import DataTable from '@/components/ui/custom-components/data-table/data-table.svelte';
	import EmptyData from '@/components/ui/custom-components/empty-data/empty-data.svelte';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
	import { TableHead } from '@/components/ui/table/index.js';
	import SearchInput from '@/features/search/components/search-input.svelte';
	import { m } from '@/lib/paraglide/messages';

	// HOOKS
	import { useConvexPagination } from '@/features/pagination/hooks/useConvexPagination.svelte.js';
	import { useSearch } from '@/features/search/hooks/useSearch.svelte.js';

	const search = useSearch({ mode: 'state' });

	const newsletters = useConvexPagination(
		api.tables.newsletters.queries.fetchNewslettersAdmin.fetchNewslettersAdmin,
		() => ({ search: search.term || undefined }),
		{
			pageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
			resetKey: () => search.term
		}
	);

	const total = $derived(newsletters.total ?? null);
	const paginationTotal = $derived(search.isActive ? null : total);
</script>

<SvelteHead title={m['AdminNewslettersPage.pageTitle']()} noindex />

<div class="flex min-h-full min-w-0 flex-1 flex-col gap-6">
	<DataTable
		pagination={newsletters}
		total={paginationTotal}
		key={(newsletter) => newsletter._id}
		placement="above"
	>
		{#snippet header()}
			<div class="flex flex-col gap-4">
				<AdminNewslettersHeader {total} showTotal={!search.isActive} />
				<SearchInput
					bind:value={search.value}
					placeholder={m['AdminNewslettersPage.searchPlaceholder']()}
					class="w-full sm:max-w-sm"
				/>
			</div>
		{/snippet}

		{#snippet head()}
			<TableHead class="min-w-64">{m['AdminNewslettersPage.emailColumn']()}</TableHead>
			<TableHead>{m['AdminNewslettersPage.statusColumn']()}</TableHead>
			<TableHead>{m['AdminNewslettersPage.subscribedColumn']()}</TableHead>
			<TableHead>{m['AdminNewslettersPage.unsubscribedColumn']()}</TableHead>
		{/snippet}

		{#snippet row(newsletter)}
			<AdminNewslettersTableItem {newsletter} />
		{/snippet}

		{#snippet loadingSnippet()}
			<AdminNewslettersTableLoading />
		{/snippet}

		{#snippet errorSnippet()}
			<ErrorComponent message={m['AdminNewslettersPage.loadError']()} />
		{/snippet}

		{#snippet empty()}
			<EmptyData
				title={search.isActive
					? m['AdminNewslettersPage.noMatchingSubscribers']()
					: m['AdminNewslettersPage.noSubscribersYet']()}
				description={search.isActive
					? m['AdminNewslettersPage.searchEmptyDescription']({ term: search.term })
					: m['AdminNewslettersPage.emptyDescription']()}
			>
				{#snippet icon()}
					<span
						class={search.isActive ? 'icon-[lucide--search] size-5' : 'icon-[lucide--mail] size-5'}
						aria-hidden="true"
					></span>
				{/snippet}
			</EmptyData>
		{/snippet}
	</DataTable>
</div>
