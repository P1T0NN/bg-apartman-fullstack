<script lang="ts">
	// LIBRARIES
	import { api } from '@convex/_generated/api';
	import { authClient } from '@/features/auth/lib/authClient';
	import { m } from '@/lib/paraglide/messages';

	// CONFIG
	import { PAGINATION_CONFIG } from '@/shared/features/pagination/config';
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// COMPONENTS
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
	import DataList from '@/components/ui/custom-components/data-list/data-list.svelte';
	import EmptyData from '@/components/ui/custom-components/empty-data/empty-data.svelte';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';
	import FavoritesHeader from '@/components/pages/(protected)/guest/favorites/favorites-header.svelte';
	import FavoritesLoading from '@/components/pages/(protected)/guest/favorites/loading/favorites-loading.svelte';
	import AccommodationCard from '@/features/accommodations/components/accommodation-card/accommodation-card.svelte';

	// HOOKS
	import { useConvexPagination } from '@/features/pagination/hooks/useConvexPagination.svelte.js';
	import { useFavorites } from '@/features/favorites/hooks/useFavorites.svelte.js';
	import { setFavoritesContext } from '@/features/favorites/context/favoritesContext.js';

	const stays = useConvexPagination(
		api.tables.favorites.queries.fetchFavorites.fetchFavorites,
		() => ({}),
		{ pageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE }
	);

	const session = authClient.useSession();
	const viewerId = $derived($session.data?.user?.id ?? null);

	const favorites = useFavorites({
		seedIds: () => stays.data.map((stay) => stay._id),
		viewerId: () => viewerId
	});
	setFavoritesContext(favorites);
</script>

<SvelteHead title={m['FavoritesPage.pageTitle']()} noindex />

<div class="flex w-full flex-col gap-6">
	<DataList
		pagination={stays}
		placement="above"
		key={(stay) => stay._id}
		class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,18rem),1fr))] gap-5"
	>
		{#snippet header()}
			<FavoritesHeader />
		{/snippet}

		{#snippet children(stay)}
			<AccommodationCard accommodation={stay} />
		{/snippet}

		{#snippet loadingSnippet()}
			<FavoritesLoading />
		{/snippet}

		{#snippet errorSnippet()}
			<ErrorComponent message={m['ErrorMessages.loadFailed']()} />
		{/snippet}

		{#snippet empty()}
			<EmptyData
				title={m['FavoritesPage.emptyTitle']()}
				description={m['FavoritesPage.emptyDescription']()}
				action={{
					label: m['FavoritesPage.findStay'](),
					href: UNPROTECTED_PAGE_ENDPOINTS.SEARCH
				}}
			>
				{#snippet icon()}
					<span class="icon-[lucide--heart] size-5" aria-hidden="true"></span>
				{/snippet}
			</EmptyData>
		{/snippet}
	</DataList>
</div>
