<script lang="ts">
	// SVELTEKIT IMPORTS
	import { page } from '$app/state';

	// LIBRARIES
	import { useQuery } from 'convex-svelte';

	// CONVEX
	import { api } from '@convex/_generated/api';

	// COMPONENTS
	import MyAccommodationListingSection from './my-accommodation-tab-listing-section.svelte';
	import MyAccommodationListingEditor from './my-accommodation-tab-listing-editor.svelte';
	import MyAccommodationTabListingLoading from '../loading/my-accommodation-tab-listing-loading.svelte';
	import EmptyData from '@/components/ui/custom-components/empty-data/empty-data.svelte';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';

	// CONFIG
	import { m } from '@/lib/paraglide/messages';

	// FEATURES
	import { createMyAccommodationTabListingForm } from '@/features/accommodations/forms/myAccommodationTabListingForm.js';

	// TYPES
	import type { Id } from '@convex/_generated/dataModel';

	// SAFETY: Convex validates the untrusted route ID before running the query.
	const accommodationId = $derived(page.params.id as Id<'accommodations'>);
	const result = useQuery(
		api.tables.accommodations.queries.fetchMyAccommodationListing.fetchMyAccommodationListing,
		() => ({ id: accommodationId })
	);

	const listing = $derived(result.data);
	const sections = $derived(listing ? createMyAccommodationTabListingForm(listing) : []);

	let active = $state<string | null>(null);

	const selected = $derived(sections.find((section) => section.id === active));

	const propertySections = $derived(sections.filter((section) => section.group === 'property'));
	const bookingSections = $derived(sections.filter((section) => section.group === 'booking'));
</script>

{#if result.error}
	<ErrorComponent message={m['ErrorMessages.loadFailed']()} />
{:else if result.isLoading}
	<MyAccommodationTabListingLoading />
{:else if listing}
	{#if selected}
		{#key selected.id}
			<MyAccommodationListingEditor section={selected} onclose={() => (active = null)} />
		{/key}
	{:else}
		<div class="flex w-full flex-col gap-8">
			<div>
				<h2 class="text-xl font-semibold">
					{m['MyAccommodationPage.MyAccommodationTabListing.title']()}
				</h2>

				<p class="mt-1 text-sm text-muted-foreground">
					{m['MyAccommodationPage.MyAccommodationTabListing.description']()}
				</p>
			</div>

			<MyAccommodationListingSection
				group="property"
				sections={propertySections}
				onopen={(id) => (active = id)}
			/>

			<MyAccommodationListingSection
				group="booking"
				sections={bookingSections}
				onopen={(id) => (active = id)}
			/>
		</div>
	{/if}
{:else}
	<EmptyData
		title={m['MyAccommodationPage.notFound']()}
		description={m['MyAccommodationPage.notFoundHint']()}
	/>
{/if}
