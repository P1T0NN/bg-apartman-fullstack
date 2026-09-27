<script lang="ts">
	// SVELTEKIT IMPORTS
	import { page } from '$app/state';

	// LIBRARIES
	import { useQuery } from 'convex-svelte';
	import { m } from '@/lib/paraglide/messages';
	import { api } from '@convex/_generated/api';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// COMPONENTS
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';
	import EmptyData from '@/components/ui/custom-components/empty-data/empty-data.svelte';
	import { Button } from '@/components/ui/button/index.js';
	import Price from '@/components/ui/custom-components/price/price.svelte';
	import AccommodationHeader from '@/components/pages/(unprotected)/accommodation/accommodation-header.svelte';
	import AccommodationGallery from '@/components/pages/(unprotected)/accommodation/accommodation-gallery/accommodation-gallery.svelte';
	import AccommodationNavigation from '@/components/pages/(unprotected)/accommodation/accommodation-navigation.svelte';
	import AccommodationDetails from '@/components/pages/(unprotected)/accommodation/accommodation-details/accommodation-details.svelte';
	import AccommodationSummary from '@/components/pages/(unprotected)/accommodation/accommodation-summary/accommodation-summary.svelte';
	import AccommodationLoading from '@/components/pages/(unprotected)/accommodation/loading/accommodation-loading.svelte';

	// TYPES
	import type { Id } from '@convex/_generated/dataModel';

	const result = useQuery(
		api.tables.accommodations.queries.fetchPublicAccommodation.fetchPublicAccommodation,
		() => ({
			// SAFETY: Convex validates this untrusted route value before the query handler runs.
			id: page.params.id as Id<'accommodations'>
		})
	);
	const accommodation = $derived(result.data);
</script>

<SvelteHead
	title={accommodation?.name ?? m['AccommodationPage.title']()}
	description={accommodation?.description}
	image={accommodation?.imageUrls[0]}
	noindex={!accommodation}
/>

<main class="mx-auto w-full max-w-7xl px-4 pb-28 sm:px-6 lg:px-8 lg:pb-16">
	{#if result.error}
		<ErrorComponent message={m['AccommodationPage.error']()} />
	{:else if result.isLoading}
		<AccommodationLoading />
	{:else if accommodation}
		{#key accommodation._id}
			<AccommodationHeader {accommodation} />

			<AccommodationGallery images={accommodation.imageUrls} name={accommodation.name} />

			<AccommodationNavigation />

			<div
				class="grid grid-cols-1 items-start gap-9 pt-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16 lg:pt-10"
			>
				<div class="min-w-0 lg:col-start-1 lg:row-start-1">
					<AccommodationDetails {accommodation} />
				</div>

				<div class="min-w-0 lg:sticky lg:top-24 lg:col-start-2 lg:row-start-1">
					<AccommodationSummary {accommodation} />
				</div>
			</div>

			<div
				class="fixed inset-x-0 bottom-0 flex items-center justify-between gap-3 border-t bg-background px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden"
			>
				<p class="flex flex-col">
					<span class="text-lg font-semibold">
						<Price value={accommodation.pricePerNightMinor} />
					</span>

					<span class="text-xs text-muted-foreground">
						{m['AccommodationsFeature.AccommodationCard.night']()}
					</span>
				</p>

				<Button href="#stay-price" class="min-h-11">{m['AccommodationPage.priceDetails']()}</Button>
			</div>
		{/key}
	{:else}
		<EmptyData
			title={m['AccommodationPage.notFound']()}
			description={m['AccommodationPage.notFoundHint']()}
			action={{
				label: m['AccommodationPage.AccommodationHeader.back'](),
				href: UNPROTECTED_PAGE_ENDPOINTS.SEARCH + page.url.search
			}}
		/>
	{/if}
</main>
