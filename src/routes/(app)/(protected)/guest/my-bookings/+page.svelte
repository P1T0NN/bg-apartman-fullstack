<script lang="ts">
	// LIBRARIES
	import { api } from '@convex/_generated/api';
	import { m } from '@/lib/paraglide/messages';

	// CONFIG
	import { PAGINATION_CONFIG } from '@/shared/features/pagination/config';
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// COMPONENTS
	import MyBookingItem from '@/components/pages/(protected)/guest/my-bookings/my-booking-item.svelte';
	import MyBookingsHeader from '@/components/pages/(protected)/guest/my-bookings/my-bookings-header.svelte';
	import MyBookingItemLoading from '@/components/pages/(protected)/guest/my-bookings/loading/my-booking-item-loading.svelte';
	import DataList from '@/components/ui/custom-components/data-list/data-list.svelte';
	import EmptyData from '@/components/ui/custom-components/empty-data/empty-data.svelte';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
	import TabsUrl from '@/components/ui/custom-components/tabs-url/tabs-url.svelte';
	import * as Tabs from '@/components/ui/tabs/index.js';
	import BookingSortSelect from '@/features/bookings/components/booking-sort-select/booking-sort-select.svelte';
	import SearchInput from '@/features/search/components/search-input.svelte';

	// HOOKS
	import { useConvexPagination } from '@/features/pagination/hooks/useConvexPagination.svelte.js';
	import { useSearch } from '@/features/search/hooks/useSearch.svelte';
	import { useFilters } from '@/features/filters/hooks/useFilters.svelte';
	import { useBookingSort } from '@/features/bookings/hooks/useBookingSort.svelte';
	import { useReviewClock } from '@/features/reviews/hooks/useReviewClock.svelte.js';

	// DATA
	import { BOOKING_STATUS_LABELS } from '@/features/bookings/data/bookingStatusLabels.js';
	import { BOOKING_STATUSES } from '@/shared/features/bookings/data/bookingsData.js';
	import { BOOKING_FILTER_DEFS } from '@/features/bookings/data/bookingFilterDefs.js';

	const search = useSearch({ mode: 'state' });
	const filters = useFilters({ mode: 'url', defs: BOOKING_FILTER_DEFS });
	const sort = useBookingSort();
	const clock = useReviewClock();

	const bookings = useConvexPagination(
		api.tables.bookings.queries.fetchMyBookings.fetchMyBookings,
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

<SvelteHead title={m['MyBookingsPage.pageTitle']()} noindex />

<div class="flex w-full flex-col gap-6">
	<MyBookingsHeader />

	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<SearchInput
			bind:value={search.value}
			placeholder={m['MyBookingsPage.searchPlaceholder']()}
			class="w-full sm:max-w-sm"
		/>
		<BookingSortSelect value={sort.sort} onSortChange={sort.setSort} disabled={search.isActive} />
	</div>

	<TabsUrl param="status" onValueChange={(status) => filters.set('status', status)} class="min-w-0">
		{#snippet children(activeStatus)}
			<div class="min-w-0 overflow-x-auto">
				<Tabs.List aria-label={m['MyBookingsPage.statusTabsLabel']()}>
					<Tabs.Trigger value="">{m['MyBookingsPage.allStatuses']()}</Tabs.Trigger>
					{#each BOOKING_STATUSES as status (status)}
						<Tabs.Trigger value={status}>{BOOKING_STATUS_LABELS[status]()}</Tabs.Trigger>
					{/each}
				</Tabs.List>
			</div>

			<Tabs.Content value={activeStatus} class="min-w-0">
				<DataList
					pagination={bookings}
					placement="above"
					key={(booking) => booking._id}
					class="mt-3 gap-4"
				>
					{#snippet children(booking)}
						<MyBookingItem {booking} now={clock.now} />
					{/snippet}

					{#snippet loadingSnippet()}
						<MyBookingItemLoading />
					{/snippet}

					{#snippet errorSnippet()}
						<ErrorComponent message={m['ErrorMessages.loadFailed']()} />
					{/snippet}

					{#snippet empty()}
						<EmptyData
							title={isFiltering
								? m['MyBookingsPage.noMatchingBookings']()
								: m['MyBookingsPage.noBookingsYet']()}
							description={search.isActive
								? m['MyBookingsPage.searchEmptyDescription']({ term: search.term })
								: filters.isActive
									? m['MyBookingsPage.filtersEmptyDescription']()
									: m['MyBookingsPage.emptyDescription']()}
							action={isFiltering
								? undefined
								: {
										label: m['MyBookingsPage.findAccommodation'](),
										href: UNPROTECTED_PAGE_ENDPOINTS.SEARCH
									}}
						>
							{#snippet icon()}
								<span
									class={isFiltering
										? 'icon-[lucide--search] size-5'
										: 'icon-[lucide--calendar] size-5'}
									aria-hidden="true"
								></span>
							{/snippet}
						</EmptyData>
					{/snippet}
				</DataList>
			</Tabs.Content>
		{/snippet}
	</TabsUrl>
</div>
