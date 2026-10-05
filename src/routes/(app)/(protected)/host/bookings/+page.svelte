<script lang="ts">
	// LIBRARIES
	import { api } from '@convex/_generated/api';
	import { MediaQuery } from 'svelte/reactivity';
	import { m } from '@/lib/paraglide/messages';

	// CONFIG
	import { PAGINATION_CONFIG } from '@/shared/features/pagination/config';
	import { PROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// COMPONENTS
	import HostBookingsItem from '@/components/pages/(protected)/host/bookings/host-bookings-item.svelte';
	import HostBookingsHeader from '@/components/pages/(protected)/host/bookings/host-bookings-header.svelte';
	import TabsUrl from '@/components/ui/custom-components/tabs-url/tabs-url.svelte';
	import * as Tabs from '@/components/ui/tabs/index.js';
	import HostBookingsTableLoading from '@/components/pages/(protected)/host/bookings/loading/host-bookings-table-loading.svelte';
	import DataList from '@/components/ui/custom-components/data-list/data-list.svelte';
	import DataTable from '@/components/ui/custom-components/data-table/data-table.svelte';
	import EmptyData from '@/components/ui/custom-components/empty-data/empty-data.svelte';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
	import { TableHead } from '@/components/ui/table';
	import BookingSortSelect from '@/features/bookings/components/booking-sort-select/booking-sort-select.svelte';
	import SearchInput from '@/features/search/components/search-input.svelte';

	// HOOKS
	import { useConvexPagination } from '@/features/pagination/hooks/useConvexPagination.svelte.js';
	import { useSearch } from '@/features/search/hooks/useSearch.svelte';
	import { useFilters } from '@/features/filters/hooks/useFilters.svelte';
	import { useBookingSort } from '@/features/bookings/hooks/useBookingSort.svelte';

	// DATA
	import { BOOKING_STATUS_LABELS } from '@/features/bookings/data/bookingStatusLabels.js';
	import { BOOKING_STATUSES } from '@/shared/features/bookings/data/bookingsData.js';
	import { BOOKING_FILTER_DEFS } from '@/features/bookings/data/bookingFilterDefs.js';

	const wideScreen = new MediaQuery('(min-width: 1280px)', false);
	const search = useSearch({ mode: 'state' });
	const filters = useFilters({ mode: 'url', defs: BOOKING_FILTER_DEFS });
	const sort = useBookingSort(() => (filters.value('status') === 'pending' ? 'oldest' : 'newest'));

	const bookings = useConvexPagination(
		api.tables.bookings.queries.fetchHostBookings.fetchHostBookings,
		() => ({
			search: search.term || undefined,
			filters: filters.active,
			sort: sort.sort
		}),
		{
			pageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
			resetKey: () => [search.term, filters.identity, sort.sort]
		}
	);

	const isFiltering = $derived(search.isActive || filters.isActive);
</script>

{#snippet emptyState()}
	<EmptyData
		title={isFiltering
			? m['HostBookingsPage.noMatchingBookings']()
			: m['HostBookingsPage.noBookingsYet']()}
		description={search.isActive
			? m['HostBookingsPage.searchEmptyDescription']({ term: search.term })
			: filters.isActive
				? m['HostBookingsPage.filtersEmptyDescription']()
				: m['HostBookingsPage.emptyDescription']()}
		action={isFiltering
			? undefined
			: {
					label: m['HostBookingsPage.addAccommodation'](),
					href: PROTECTED_PAGE_ENDPOINTS.ADD_ACCOMMODATION
				}}
	>
		{#snippet icon()}
			<span
				class={isFiltering
					? 'icon-[lucide--search] size-5'
					: 'icon-[lucide--calendar-check] size-5'}
				aria-hidden="true"
			></span>
		{/snippet}
	</EmptyData>
{/snippet}

<SvelteHead title={m['HostBookingsPage.pageTitle']()} noindex />
<div class="flex min-h-full min-w-0 flex-1 flex-col gap-6">
	<HostBookingsHeader />

	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<SearchInput
			bind:value={search.value}
			placeholder={m['HostBookingsPage.searchPlaceholder']()}
			class="w-full sm:max-w-sm"
		/>
		<BookingSortSelect value={sort.sort} onSortChange={sort.setSort} disabled={search.isActive} />
	</div>

	<TabsUrl param="status" onValueChange={(status) => filters.set('status', status)} class="min-w-0">
		{#snippet children(activeStatus)}
			<div class="min-w-0 overflow-x-auto">
				<Tabs.List aria-label={m['HostBookingsPage.statusTabsLabel']()}>
					<Tabs.Trigger value="">{m['HostBookingsPage.allStatuses']()}</Tabs.Trigger>
					{#each BOOKING_STATUSES as status (status)}
						<Tabs.Trigger value={status}>{BOOKING_STATUS_LABELS[status]()}</Tabs.Trigger>
					{/each}
				</Tabs.List>
			</div>

			<Tabs.Content value={activeStatus} class="min-w-0">
				{#if wideScreen.current}
					<DataTable pagination={bookings} key={(booking) => booking._id} placement="above">
						{#snippet head()}
							<TableHead>{m['HostBookingsPage.columns.guest']()}</TableHead>
							<TableHead>{m['HostBookingsPage.columns.stay']()}</TableHead>
							<TableHead>{m['HostBookingsPage.columns.accommodation']()}</TableHead>
							<TableHead>{m['HostBookingsPage.columns.status']()}</TableHead>
							<TableHead class="text-right">{m['HostBookingsPage.columns.actions']()}</TableHead>
						{/snippet}

						{#snippet row(booking)}
							<HostBookingsItem {booking} />
						{/snippet}

						{#snippet loadingSnippet()}
							<HostBookingsTableLoading />
						{/snippet}

						{#snippet errorSnippet()}
							<ErrorComponent message={m['ErrorMessages.loadFailed']()} />
						{/snippet}

						{#snippet empty()}
							{@render emptyState()}
						{/snippet}
					</DataTable>
				{:else}
					<DataList pagination={bookings} key={(booking) => booking._id} class="gap-3">
						{#snippet children(booking)}
							<HostBookingsItem {booking} layout="stacked" />
						{/snippet}

						{#snippet loadingSnippet()}
							<HostBookingsTableLoading layout="stacked" />
						{/snippet}

						{#snippet errorSnippet()}
							<ErrorComponent message={m['ErrorMessages.loadFailed']()} />
						{/snippet}

						{#snippet empty()}
							{@render emptyState()}
						{/snippet}
					</DataList>
				{/if}
			</Tabs.Content>
		{/snippet}
	</TabsUrl>
</div>
