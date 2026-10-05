<script lang="ts">
	// SVELTEKIT IMPORTS
	import { page } from '$app/state';

	// LIBRARIES
	import { useCachedConvexQuery } from '@/hooks/useCachedConvexQuery.svelte.js';

	// CONVEX
	import { api } from '@convex/_generated/api';
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';
	import EmptyData from '@/components/ui/custom-components/empty-data/empty-data.svelte';
	import BookingConfirmationLoading from '@/components/pages/(unprotected)/book-confirmation/loading/booking-confirmation-loading.svelte';

	import BookingConfirmationHeader from '@/components/pages/(unprotected)/book-confirmation/booking-confirmation-header.svelte';
	import BookingConfirmationDetails from '@/components/pages/(unprotected)/book-confirmation/booking-confirmation-details.svelte';

	// TYPES
	import type { Id } from '@convex/_generated/dataModel';

	const result = useCachedConvexQuery(
		api.tables.bookings.queries.fetchBookingConfirmation.fetchBookingConfirmation,
		() => ({
			// SAFETY: Convex validates the untrusted route ID before running the query.
			id: page.params.id as Id<'bookings'>
		})
	);
	const confirmation = $derived(result.data);
</script>

<SvelteHead
	title={confirmation && confirmation.status !== 'pending'
		? m[`BookingsFeature.status.${confirmation.status}`]()
		: m['BookingPage.BookingCheckout.booked']()}
	noindex
/>

<main class="mx-auto w-full max-w-5xl px-4 py-12 pb-16 sm:px-6 sm:py-16 lg:px-8">
	{#if result.error}
		<ErrorComponent message={m['ErrorMessages.loadFailed']()} />
	{:else if result.isLoading}
		<BookingConfirmationLoading />
	{:else if confirmation}
		<BookingConfirmationHeader status={confirmation.status} />
		<BookingConfirmationDetails {confirmation} />
	{:else}
		<EmptyData
			title={m['BookingPage.BookingConfirmation.notFound']()}
			description={m['BookingPage.BookingConfirmation.notFoundHint']()}
		/>
	{/if}
</main>
