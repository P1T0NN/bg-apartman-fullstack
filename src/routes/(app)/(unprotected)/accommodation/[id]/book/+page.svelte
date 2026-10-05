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
	import BookHeader from '@/components/pages/(unprotected)/book/book-header.svelte';
	import BookCheckout from '@/components/pages/(unprotected)/book/book-checkout/book-checkout.svelte';
	import BookLoading from '@/components/pages/(unprotected)/book/loading/book-loading.svelte';

	// TYPES
	import type { Id } from '@convex/_generated/dataModel';

	const result = useQuery(
		api.tables.accommodations.queries.fetchPublicAccommodation.fetchPublicAccommodation,
		() => ({
			// SAFETY: Convex validates the untrusted route ID before running the query.
			id: page.params.id as Id<'accommodations'>
		}),
		{ keepPreviousData: true }
	);

	const accommodation = $derived(result.data);

	const loadingAccommodation = $derived(
		result.isLoading || (result.isStale && accommodation?._id !== page.params.id)
	);
</script>

<SvelteHead title={m['BookAccommodationPage.title']()} noindex />

<main class="mx-auto w-full max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
	{#if result.error}
		<ErrorComponent message={m['ErrorMessages.loadFailed']()} />
	{:else if loadingAccommodation}
		<BookLoading />
	{:else if accommodation}
		{#key accommodation._id}
			<BookHeader mode={accommodation.bookingMode} />

			<BookCheckout 
				{accommodation} 
				availabilityLoading={result.isStale} 
			/>
		{/key}
	{:else}
		<EmptyData
			title={m['BookAccommodationPage.notFound']()}
			description={m['BookAccommodationPage.notFoundHint']()}
		/>
	{/if}
</main>
