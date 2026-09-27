<script lang="ts">
	// LIBRARIES
	import { api } from '@convex/_generated/api';
	import { m } from '@/lib/paraglide/messages';

	// CONFIG
	import { PAGINATION_CONFIG } from '@/shared/features/pagination/config';
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// COMPONENTS
	import MyBookingCard from '@/components/pages/(protected)/guest/my-bookings/my-booking-card.svelte';
	import MyBookingsHeader from '@/components/pages/(protected)/guest/my-bookings/my-bookings-header.svelte';
	import MyBookingCardLoading from '@/components/pages/(protected)/guest/my-bookings/loading/my-booking-card-loading.svelte';
	import DataList from '@/components/ui/custom-components/data-list/data-list.svelte';
	import EmptyData from '@/components/ui/custom-components/empty-data/empty-data.svelte';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
	import SearchInput from '@/features/search/components/search-input.svelte';

	// HOOKS
	import { useConvexPagination } from '@/features/pagination/hooks/useConvexPagination.svelte.js';
	import { useSearch } from '@/features/search/hooks/useSearch.svelte';

	const search = useSearch({ mode: 'state' });

	const bookings = useConvexPagination(
		api.tables.bookings.queries.fetchMyBookings.fetchMyBookings,
		() => ({
			search: search.term || undefined
		}),
		{
			pageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
			resetKey: () => [search.term]
		}
	);

	const total = $derived(bookings.total ?? null);
	const paginationTotal = $derived(search.isActive ? null : total);
</script>

<SvelteHead title={m['MyBookingsPage.pageTitle']()} noindex />

<div class="flex w-full flex-col gap-6">
	<DataList
		pagination={bookings}
		total={paginationTotal}
		placement="above"
		key={(booking) => booking._id}
		class="grid gap-4 lg:grid-cols-2"
	>
		{#snippet header()}
			<div class="flex flex-col gap-4">
				<MyBookingsHeader {total} showTotal={!search.isActive} />
				<SearchInput
					bind:value={search.value}
					placeholder={m['MyBookingsPage.searchPlaceholder']()}
					class="w-full sm:max-w-sm"
				/>
			</div>
		{/snippet}

		{#snippet children(booking)}
			<MyBookingCard {booking} />
		{/snippet}

		{#snippet loadingSnippet()}
			<MyBookingCardLoading />
		{/snippet}

		{#snippet errorSnippet()}
			<ErrorComponent message={m['ErrorMessages.loadFailed']()} />
		{/snippet}

		{#snippet empty()}
			<EmptyData
				title={search.isActive
					? m['MyBookingsPage.noMatchingBookings']()
					: m['MyBookingsPage.noBookingsYet']()}
				description={search.isActive
					? m['MyBookingsPage.searchEmptyDescription']({ term: search.term })
					: m['MyBookingsPage.emptyDescription']()}
				action={search.isActive
					? undefined
					: {
							label: m['MyBookingsPage.findAccommodation'](),
							href: UNPROTECTED_PAGE_ENDPOINTS.SEARCH
						}}
			>
				{#snippet icon()}
					<span
						class={search.isActive
							? 'icon-[lucide--search] size-5'
							: 'icon-[lucide--calendar] size-5'}
					></span>
				{/snippet}
			</EmptyData>
		{/snippet}
	</DataList>
</div>
