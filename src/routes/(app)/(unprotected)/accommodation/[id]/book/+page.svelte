<script lang="ts">
	// SVELTEKIT IMPORTS
	import { page } from '$app/state';

	// LIBRARIES
	import { useQuery } from 'convex-svelte';
	import { api } from '@convex/_generated/api';
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';
	import EmptyData from '@/components/ui/custom-components/empty-data/empty-data.svelte';
	import BookingHeader from '@/components/pages/(unprotected)/book/booking-header.svelte';
	import BookingCheckout from '@/components/pages/(unprotected)/book/booking-checkout/booking-checkout.svelte';
	import BookingLoading from '@/components/pages/(unprotected)/book/loading/booking-loading.svelte';

	// TYPES
	import type { Id } from '@convex/_generated/dataModel';

	const result = useQuery(
		api.tables.accommodations.queries.fetchPublicAccommodation.fetchPublicAccommodation,
		() => ({
			// SAFETY: Convex validates the untrusted route ID before running the query.
			id: page.params.id as Id<'accommodations'>
		})
	);
	const accommodation = $derived(result.data);
</script>

<SvelteHead title={m['BookingPage.title']()} noindex />

<main class="mx-auto w-full max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
	<BookingHeader />

	{#if result.error}
		<ErrorComponent message={m['ErrorMessages.loadFailed']()} />
	{:else if result.isLoading}
		<BookingLoading />
	{:else if accommodation}
		{#key accommodation._id}
			<BookingCheckout {accommodation} />
		{/key}
	{:else}
		<EmptyData
			title={m['AccommodationPage.notFound']()}
			description={m['AccommodationPage.notFoundHint']()}
		/>
	{/if}
</main>
