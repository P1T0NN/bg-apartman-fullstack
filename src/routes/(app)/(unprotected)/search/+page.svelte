<script lang="ts">
	// SVELTEKIT IMPORTS
	import { page } from '$app/state';

	// LIBRARIES
	import { authClient } from '@/features/auth/lib/authClient';
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
	import NativeSelect from '@/components/ui/native-components/native-select/native-select.svelte';
	import DataList from '@/components/ui/custom-components/data-list/data-list.svelte';
	import EmptyData from '@/components/ui/custom-components/empty-data/empty-data.svelte';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';
	import SearchHeader from '@/components/pages/(unprotected)/search/search-header/search-header.svelte';
	import SearchMap from '@/components/pages/(unprotected)/search/search-map/search-map.svelte';
	import AuthDialog from '@/features/auth/components/auth-dialog/auth-dialog.svelte';
	import AccommodationCard from '@/features/accommodations/components/accommodation-card/accommodation-card.svelte';
	import AccommodationCardLoading from '@/features/accommodations/components/accommodation-card/accommodation-card-loading.svelte';

	// HOOKS
	import { useSearchAccommodations } from '@/features/search/hooks/useSearchAccommodations.svelte.js';
	import { setSearchContext } from '@/features/search/context/searchContext.js';
	import { useSearchCriteria } from '@/features/search/hooks/useSearchCriteria.svelte.js';
	import { useFavorites } from '@/features/favorites/hooks/useFavorites.svelte.js';
	import { setFavoritesContext } from '@/features/favorites/context/favoritesContext.js';

	// CONFIG
	import { PAGINATION_CONFIG } from '@/shared/features/pagination/config';

	// UTILS
	import { cn } from '@/utils/utils.js';

	let { data } = $props();

	const place = $derived(data.placeDetails);
	const hasLocation = $derived(Boolean(place?.country));
	const mapPosition = $derived(place?.position ?? null);
	const destination = $derived([place?.city, place?.country].filter(Boolean).join(', '));

	const search = useSearchCriteria({ hasLocation: () => hasLocation });
	setSearchContext(search);

	function readNumber(key: string): number | undefined {
		const parsed = Number.parseInt(page.url.searchParams.get(key) ?? '', 10);
		return Number.isFinite(parsed) ? parsed : undefined;
	}

	const accommodations = useSearchAccommodations(
		() => ({
			location: { city: place?.city ?? undefined, country: place?.country ?? undefined },
			adults: readNumber('adults'),
			children: readNumber('children'),
			rooms: readNumber('rooms')
		}),
		{ pageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE }
	);

	const stayMarkers = $derived(
		accommodations.data.map((stay) => ({
			id: stay._id,
			lat: stay.latitude,
			lng: stay.longitude,
			name: stay.name,
			priceMinor: stay.pricePerNightMinor
		}))
	);

	const session = authClient.useSession();
	const viewerId = $derived($session.data?.user?.id ?? null);

	let authDialog: AuthDialog;

	const favorites = useFavorites({
		seedIds: () => accommodations.favoriteIds,
		viewerId: () => viewerId,
		onAuthRequired: () => {
			if ($session.isPending) return;
			authDialog.open('sign-in');
		}
	});
	setFavoritesContext(favorites);

	let hoveredId = $state<string | null>(null);
</script>

<SvelteHead title={m['SearchPage.pageTitle']()} noindex />
<SearchHeader initialLocation={destination} />

<main
	class="w-full px-4 py-5 sm:px-6 min-[68.75rem]:px-8"
	{@attach accommodations.load(accommodations.key, viewerId)}
>
	<div
		class={cn(
			'grid items-start gap-7 pt-6',
			hasLocation && 'min-[68.75rem]:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]'
		)}
	>
		<section
			class={search.mapVisible ? 'hidden min-w-0 min-[68.75rem]:block' : 'min-w-0'}
			aria-label={m['SearchPage.pageTitle']()}
		>
			<div class="mb-6 flex flex-wrap items-start justify-between gap-4">
				<div>
					{#if destination}
						<h1 class="text-2xl font-semibold tracking-tight">
							{m['SearchPage.staysIn']({ destination: destination.split(',')[0] })}
						</h1>
					{:else}
						<h1 class="text-2xl font-semibold tracking-tight">
							{m['SearchPage.chooseDestination']()}
						</h1>
						<p class="mt-2 text-xs text-muted-foreground">
							{m['SearchPage.chooseDestinationHint']()}
						</p>
					{/if}
				</div>
				{#if hasLocation}
					<div class="hidden min-[68.75rem]:block">
						<NativeSelect
							label={m['SearchPage.SearchFilters.sort']()}
							options={search.sorts}
							value={search.criteria.sort}
							onchange={(value) => search.setCriteria({ ...search.criteria, sort: value })}
							includePlaceholderOption={false}
						/>
					</div>
				{/if}
			</div>

			{#if hasLocation}
				<DataList
					pagination={accommodations}
					key={(item) => item._id}
					class="grid grid-cols-1 gap-x-5 gap-y-9 sm:grid-cols-2"
				>
					{#snippet children(accommodation)}
						<AccommodationCard
							{accommodation}
							onhover={(hovered) => (hoveredId = hovered ? accommodation._id : null)}
						/>
					{/snippet}
					{#snippet loadingSnippet()}
						<AccommodationCardLoading multiple />
					{/snippet}
					{#snippet errorSnippet()}
						<ErrorComponent message={m['SearchPage.error']()} retry={accommodations.retry} />
					{/snippet}
					{#snippet empty()}
						<EmptyData title={m['SearchPage.empty']()} description={m['SearchPage.emptyHint']()}>
							{#snippet icon()}
								<span class="icon-[lucide--search] size-5" aria-hidden="true"></span>
							{/snippet}
						</EmptyData>
					{/snippet}
				</DataList>
			{/if}
		</section>

		{#if hasLocation}
			<SearchMap
				{destination}
				position={mapPosition}
				markers={stayMarkers}
				highlightedId={hoveredId}
			/>
		{/if}
	</div>
</main>

<AuthDialog bind:this={authDialog} />
