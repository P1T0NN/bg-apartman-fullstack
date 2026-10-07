<script lang="ts">
	// LIBRARIES
	import { MediaQuery } from 'svelte/reactivity';
	import { api } from '@convex/_generated/api';
	import { m } from '@/lib/paraglide/messages';

	// CONFIG
	import { PAGINATION_CONFIG } from '@/shared/features/pagination/config';
	import { PROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// COMPONENTS
	import MyAccommodationItem from '@/components/pages/(protected)/host/my-accommodations/my-accommodation-item.svelte';
	import MyAccommodationsHeader from '@/components/pages/(protected)/host/my-accommodations/my-accommodations-header.svelte';
	import MyAccommodationItemLoading from '@/components/pages/(protected)/host/my-accommodations/loading/my-accommodation-item-loading.svelte';
	import DataTable from '@/components/ui/custom-components/data-table/data-table.svelte';
	import { TableHead } from '@/components/ui/table/index.js';
	import DataList from '@/components/ui/custom-components/data-list/data-list.svelte';
	import EmptyData from '@/components/ui/custom-components/empty-data/empty-data.svelte';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
	import SearchInput from '@/features/search/components/search-input.svelte';
	import NativeSelect from '@/components/ui/native-components/native-select/native-select.svelte';
	import { Button } from '@/components/ui/button';

	// HOOKS
	import { useConvexPagination } from '@/features/pagination/hooks/useConvexPagination.svelte.js';
	import { useSearch } from '@/features/search/hooks/useSearch.svelte';
	import { useFilters } from '@/features/filters/hooks/useFilters.svelte';

	// DATA
	import { ACCOMMODATION_FILTER_DEFS } from '@/features/accommodations/data/accommodationFilterDefs.js';

	const wideScreen = new MediaQuery('(min-width: 1280px)', false);

	const search = useSearch({ mode: 'state' });
	const filters = useFilters({ mode: 'state', defs: ACCOMMODATION_FILTER_DEFS });

	const accommodations = useConvexPagination(
		api.tables.accommodations.queries.fetchMyAccommodations.fetchMyAccommodations,
		() => ({
			search: search.term || undefined,
			filters: filters.active
		}),
		{
			pageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
			resetKey: () => [search.term, filters.identity]
		}
	);

	const total = $derived(accommodations.total ?? null);
	const paginationTotal = $derived(search.isActive || filters.isActive ? null : total);
	const isFiltering = $derived(search.isActive || filters.isActive);
</script>

{#snippet listHeader()}
	<div class="flex flex-col gap-4">
		<MyAccommodationsHeader {total} showTotal={!isFiltering} />
		<div class="flex flex-wrap items-center gap-2">
			<SearchInput
				bind:value={search.value}
				placeholder={m['MyAccommodationsPage.searchPlaceholder']()}
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
					{m['MyAccommodationsPage.clearFilters']({ count: filters.count })}
				</Button>
			{/if}
		</div>
	</div>
{/snippet}

{#snippet emptyState()}
	<EmptyData
		title={isFiltering
			? m['MyAccommodationsPage.noMatchingAccommodations']()
			: m['MyAccommodationsPage.noAccommodationsYet']()}
		description={search.isActive
			? m['MyAccommodationsPage.searchEmptyDescription']({ term: search.term })
			: filters.isActive
				? m['MyAccommodationsPage.filtersEmptyDescription']()
				: m['MyAccommodationsPage.emptyDescription']()}
		action={isFiltering
			? undefined
			: {
					label: m['MyAccommodationsPage.addAccommodation'](),
					href: PROTECTED_PAGE_ENDPOINTS.ADD_ACCOMMODATION
				}}
	>
		{#snippet icon()}
			<span
				class={isFiltering ? 'icon-[lucide--search] size-5' : 'icon-[lucide--house] size-5'}
			></span>
		{/snippet}
	</EmptyData>
{/snippet}

{#snippet loadingState()}
	<div role="status" aria-label={m['MyAccommodationsPage.loading']()}>
		<MyAccommodationItemLoading layout={wideScreen.current ? 'table' : 'stacked'} />
	</div>
{/snippet}

{#snippet errorState()}
	<ErrorComponent message={m['ErrorMessages.loadFailed']()} />
{/snippet}

<SvelteHead title={m['MyAccommodationsPage.pageTitle']()} noindex />

<div class="flex w-full min-w-0 flex-col gap-6">
	{#if wideScreen.current}
		<DataTable
			class="min-w-[1100px] table-fixed"
			pagination={accommodations}
			total={paginationTotal}
			placement="above"
			key={(accommodation) => accommodation._id}
			header={listHeader}
			loadingSnippet={loadingState}
			errorSnippet={errorState}
			empty={emptyState}
		>
			{#snippet head()}
				<TableHead style="width: 25%">
					{m['MyAccommodationsPage.columns.accommodation']()}
				</TableHead>
				<TableHead style="width: 14%">{m['MyAccommodationsPage.columns.visibility']()}</TableHead>
				<TableHead style="width: 15%">{m['MyAccommodationsPage.columns.feePlan']()}</TableHead>
				<TableHead style="width: 14%">{m['MyAccommodationsPage.columns.nightlyPrice']()}</TableHead>
				<TableHead style="width: 11%">{m['MyAccommodationsPage.columns.paidUntil']()}</TableHead>
				<TableHead style="width: 21%" class="text-right">
					{m['MyAccommodationsPage.columns.actions']()}
				</TableHead>
			{/snippet}
			{#snippet row(accommodation)}
				<MyAccommodationItem {accommodation} layout="table" />
			{/snippet}
		</DataTable>
	{:else}
		<DataList
			pagination={accommodations}
			total={paginationTotal}
			placement="above"
			key={(accommodation) => accommodation._id}
			class="gap-3"
			header={listHeader}
			loadingSnippet={loadingState}
			errorSnippet={errorState}
			empty={emptyState}
		>
			{#snippet children(accommodation)}
				<MyAccommodationItem {accommodation} layout="stacked" />
			{/snippet}
		</DataList>
	{/if}
</div>
