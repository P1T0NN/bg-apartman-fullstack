<script lang="ts">
	// LIBRARIES
	import { api } from '@convex/_generated/api.js';
	import { m } from '@/lib/paraglide/messages.js';

	// COMPONENTS
	import DataTable from '@/components/ui/custom-components/data-table/data-table.svelte';
	import EmptyData from '@/components/ui/custom-components/empty-data/empty-data.svelte';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
	import NativeSelect from '@/components/ui/native-components/native-select/native-select.svelte';
	import SearchInput from '@/features/search/components/search-input.svelte';
	import { TableHead } from '@/components/ui/table/index.js';
	import { Button } from '@/components/ui/button/index.js';
	import AdminAccommodationsHeader from '@/components/pages/admin/accommodations/admin-accommodations-header/admin-accommodations-header.svelte';
	import AdminAccommodationsItem from '@/components/pages/admin/accommodations/admin-accommodations-item/admin-accommodations-item.svelte';
	import AdminAccommodationsLoading from '@/components/pages/admin/accommodations/loading/admin-accommodations-loading.svelte';

	// HOOKS
	import { useConvexPagination } from '@/features/pagination/hooks/useConvexPagination.svelte.js';
	import { useSearch } from '@/features/search/hooks/useSearch.svelte.js';
	import { useFilters } from '@/features/filters/hooks/useFilters.svelte.js';

	// CONFIG
	import { PAGINATION_CONFIG } from '@/shared/features/pagination/config.js';

	// DATA
	import { ADMIN_ACCOMMODATION_FILTER_DEFS } from '@/features/accommodations/data/adminAccommodationFilterDefs.js';

	const search = useSearch({ mode: 'state' });
	const filters = useFilters({ mode: 'state', defs: ADMIN_ACCOMMODATION_FILTER_DEFS });
	const accommodations = useConvexPagination(
		api.tables.accommodations.queries.fetchAccommodationsAdmin.fetchAccommodationsAdmin,
		() => ({ search: search.term || undefined, filters: filters.active }),
		{
			pageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
			resetKey: () => [search.term, filters.identity]
		}
	);
</script>

<SvelteHead title={m['AdminAccommodationsPage.pageTitle']()} noindex />

<div class="flex min-w-0 flex-col gap-6">
	<DataTable
		pagination={accommodations}
		key={(accommodation) => accommodation._id}
		placement="above"
		class="min-w-300 table-fixed"
	>
		{#snippet header()}
			<div class="flex flex-col gap-4">
				<AdminAccommodationsHeader />

				<div class="flex flex-wrap items-center gap-2">
					<SearchInput
						bind:value={search.value}
						placeholder={m['AdminAccommodationsPage.searchPlaceholder']()}
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
							{m['AdminAccommodationsPage.clearFilters']({ count: filters.count })}
						</Button>
					{/if}
				</div>
			</div>
		{/snippet}

		{#snippet head()}
			<TableHead style="width: 24%">
				{m['AdminAccommodationsPage.columns.accommodation']()}
			</TableHead>
			<TableHead style="width: 16%">{m['AdminAccommodationsPage.columns.owner']()}</TableHead>
			<TableHead style="width: 10%">{m['AdminAccommodationsPage.columns.visibility']()}</TableHead>
			<TableHead style="width: 13%">{m['AdminAccommodationsPage.columns.billing']()}</TableHead>
			<TableHead style="width: 14%">{m['AdminAccommodationsPage.columns.feePlan']()}</TableHead>
			<TableHead style="width: 13%">{m['AdminAccommodationsPage.columns.periodEnds']()}</TableHead>
			<TableHead style="width: 10%" class="text-right">
				{m['AdminAccommodationsPage.columns.actions']()}
			</TableHead>
		{/snippet}

		{#snippet row(accommodation)}
			<AdminAccommodationsItem {accommodation} />
		{/snippet}

		{#snippet loadingSnippet()}
			<AdminAccommodationsLoading />
		{/snippet}

		{#snippet errorSnippet()}
			<ErrorComponent message={m['ErrorMessages.loadFailed']()} />
		{/snippet}

		{#snippet empty()}
			<EmptyData title={m['AdminAccommodationsPage.empty']()} />
		{/snippet}
	</DataTable>
</div>
