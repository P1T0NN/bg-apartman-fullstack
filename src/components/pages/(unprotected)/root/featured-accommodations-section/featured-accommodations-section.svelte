<script lang="ts">
	// LIBRARIES
	import { useQuery } from 'convex-svelte';
	import { api } from '@convex/_generated/api.js';
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import Section from '@/components/ui/custom-components/section/section.svelte';
	import EmptyData from '@/components/ui/custom-components/empty-data/empty-data.svelte';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';
	import AccommodationCard from '@/features/accommodations/components/accommodation-card/accommodation-card.svelte';
	import FeaturedAccommodationsSectionLoading from './loading/featured-accommodations-section-loading.svelte';

	const uid = $props.id();

	const featured = useQuery(
		api.tables.accommodations.queries.fetchFeaturedAccommodations.fetchFeaturedAccommodations,
		() => ({})
	);
</script>

<Section aria-labelledby={`${uid}-title`}>
	<div class="flex flex-col gap-8">
		<div class="flex max-w-2xl flex-col gap-3">
			<h2
				id={`${uid}-title`}
				class="text-3xl font-semibold tracking-tight text-balance sm:text-4xl"
			>
				{m['HomePage.FeaturedAccommodationsSection.title']()}
			</h2>
			
			<p class="text-muted-foreground">
				{m['HomePage.FeaturedAccommodationsSection.description']()}
			</p>
		</div>

		{#if featured.error}
			<ErrorComponent message={m['ErrorMessages.loadFailed']()} />
		{:else if featured.isLoading}
			<div role="status" aria-label={m['HomePage.FeaturedAccommodationsSection.loading']()}>
				<FeaturedAccommodationsSectionLoading />
			</div>
		{:else if featured.data && featured.data.length > 0}
			<ul class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{#each featured.data as accommodation (accommodation._id)}
					<li>
						<AccommodationCard {accommodation} showFavorite={false} />
					</li>
				{/each}
			</ul>
		{:else}
			<EmptyData
				title={m['HomePage.FeaturedAccommodationsSection.emptyTitle']()}
				description={m['HomePage.FeaturedAccommodationsSection.emptyDescription']()}
				card
			/>
		{/if}
	</div>
</Section>
