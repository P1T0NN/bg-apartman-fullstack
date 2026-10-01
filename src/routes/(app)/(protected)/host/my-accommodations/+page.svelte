<script lang="ts">
	// LIBRARIES
	import { api } from '@convex/_generated/api';
	import { m } from '@/lib/paraglide/messages';

	// CONFIG
	import { PAGINATION_CONFIG } from '@/shared/features/pagination/config';
	import { PROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// COMPONENTS
	import MyAccommodationCard from '@/components/pages/(protected)/host/my-accommodations/my-accommodation-card.svelte';
	import MyAccommodationsHeader from '@/components/pages/(protected)/host/my-accommodations/my-accommodations-header.svelte';
	import MyAccommodationCardLoading from '@/components/pages/(protected)/host/my-accommodations/loading/my-accommodation-card-loading.svelte';
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

<SvelteHead title={m['MyAccommodationsPage.pageTitle']()} noindex />

<div class="flex w-full flex-col gap-6">
	<DataList
		pagination={accommodations}
		total={paginationTotal}
		placement="above"
		key={(accommodation) => accommodation._id}
		class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,18rem),1fr))] gap-5"
	>
		{#snippet header()}
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

		{#snippet children(accommodation)}
			<MyAccommodationCard {accommodation} />
		{/snippet}

		{#snippet loadingSnippet()}
			<MyAccommodationCardLoading />
		{/snippet}

		{#snippet errorSnippet()}
			<ErrorComponent message={m['ErrorMessages.loadFailed']()} />
		{/snippet}

		{#snippet empty()}
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
	</DataList>
</div>
