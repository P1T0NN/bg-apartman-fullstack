<script lang="ts">
	// LIBRARIES
	import { api } from '@convex/_generated/api';
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import DataList from '@/components/ui/custom-components/data-list/data-list.svelte';
	import AccommodationReviewBookingItem from './accommodation-review-booking-item.svelte';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';
	import { Skeleton } from '@/components/ui/skeleton/index.js';

	// HOOKS
	import { useConvexPagination } from '@/features/pagination/hooks/useConvexPagination.svelte.js';
	import { useReviewDate } from '@/features/reviews/hooks/useReviewDate.svelte.js';

	// TYPES
	import type { Id } from '@convex/_generated/dataModel';

	let {
		accommodationId,
		accommodationName
	}: { accommodationId: Id<'accommodations'>; accommodationName: string } = $props();

	const date = useReviewDate();

	const bookings = useConvexPagination(
		api.tables.reviews.queries.fetchEligibleReviewBookings.fetchEligibleReviewBookings,
		() => ({ accommodationId, today: date.today }),
		{ pageSize: 5 }
	);
</script>

{#if bookings.loading}
	<Skeleton class="h-11 w-40" />
{:else if bookings.error}
	<ErrorComponent message={m['ErrorMessages.loadFailed']()} />
{:else if bookings.data.length || bookings.nextCursor || bookings.page > 1}
	<div class="flex flex-col gap-3">
		<p class="text-sm text-muted-foreground">
			{m['AccommodationPage.AccommodationReviewBookings.chooseStay']()}
		</p>
		<DataList pagination={bookings} key={(booking) => booking._id} class="gap-2">
			{#snippet children(booking)}
				<AccommodationReviewBookingItem {booking} {accommodationName} />
			{/snippet}

			{#snippet loadingSnippet()}
				<Skeleton class="h-11 w-64" />
			{/snippet}

			{#snippet errorSnippet()}
				<ErrorComponent message={m['ErrorMessages.loadFailed']()} />
			{/snippet}
		</DataList>
	</div>
{/if}
