<script lang="ts">
	// LIBRARIES
	import { api } from '@convex/_generated/api';
	import { m } from '@/lib/paraglide/messages';

	// CONFIG
	import { PAGINATION_CONFIG } from '@/shared/features/pagination/config.js';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import DataList from '@/components/ui/custom-components/data-list/data-list.svelte';
	import EmptyData from '@/components/ui/custom-components/empty-data/empty-data.svelte';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';
	import FindBookingDetailsItem from './find-booking-details-item.svelte';
	import FindBookingDetailsListHeader from './find-booking-details-list-header.svelte';
	import FindBookingDetailsLoading from './loading/find-booking-details-loading.svelte';

	// HOOKS
	import { useSearchParams } from '@/hooks/useSearchParams.svelte.js';
	import { useConvexPagination } from '@/features/pagination/hooks/useConvexPagination.svelte.js';

	let { token }: { token: string } = $props();

	const params = useSearchParams(['token']);

	const bookings = useConvexPagination(
		api.tables.bookings.queries.fetchBooking.fetchBooking,
		() => ({ token }),
		{ pageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE }
	);
</script>

{#if bookings.result.error}
	<ErrorComponent message={m['ErrorMessages.loadFailed']()} />
{:else if bookings.result.isLoading}
	<FindBookingDetailsListHeader />
	<FindBookingDetailsLoading />
{:else if bookings.result.data === null}
	<EmptyData
		title={m['FindBookingPage.FindBookingDetails.invalidTitle']()}
		description={m['FindBookingPage.FindBookingDetails.invalidDescription']()}
		card
	/>
{:else}
	<DataList
		pagination={bookings}
		key={(booking) => booking._id}
		class="mb-6 gap-4"
		emptyTitle={m['FindBookingPage.FindBookingDetails.emptyTitle']()}
		emptyDescription={m['FindBookingPage.FindBookingDetails.emptyDescription']()}
	>
		{#snippet header()}
			<FindBookingDetailsListHeader />
		{/snippet}

		{#snippet loadingSnippet()}
			<FindBookingDetailsLoading />
		{/snippet}

		{#snippet children(booking)}
			<FindBookingDetailsItem {booking} {token} />
		{/snippet}
	</DataList>
{/if}

<div class="mt-6 border-t pt-6">
	<Button
		type="button"
		variant={bookings.result.data === null ? 'default' : 'outline'}
		class="min-h-11 w-full sm:w-auto"
		onclick={() => params.write({ token: '' })}
	>
		{bookings.result.data === null
			? m['FindBookingPage.FindBookingDetails.requestNewLink']()
			: m['FindBookingPage.FindBookingDetails.useAnotherEmail']()}
	</Button>
</div>
