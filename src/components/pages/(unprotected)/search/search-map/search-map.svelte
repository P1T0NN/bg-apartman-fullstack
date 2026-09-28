<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	import { getAllContexts, mount, onDestroy, unmount } from 'svelte';

	// CONTEXTS
	import { getSearchContext } from '@/features/search/context/searchContext.js';

	// COMPONENTS
	import GoogleMap from '@/components/ui/custom-components/google-components/google-map/google-map.svelte';
	import SearchMapPin from './search-map-pin.svelte';
	import SearchMapLoading from '../loading/search-map-loading.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { PublicAccommodation } from '@/shared/features/accommodations/types/accommodationTypes.js';
	import type {
		MapBounds,
		Position
	} from '@/components/ui/custom-components/google-components/google-map/useGoogleMap.svelte.js';

	let {
		destination,
		position,
		markers = [],
		highlightedId = null,
		loading = false,
		onBoundsChange,
		onMovingChange
	}: {
		destination: string;
		position: Position | null;
		markers?: PublicAccommodation[];
		highlightedId?: string | null;
		loading?: boolean;
		onBoundsChange: (bounds: MapBounds) => void;
		onMovingChange: (moving: boolean) => void;
	} = $props();

	const search = getSearchContext();
	// Marker content lives outside Svelte's tree, so mounted pins receive this
	// component's context (favorites, search) explicitly.
	const contexts = getAllContexts();
	// Search owns the request timing and loading UX; useGoogleMap reports raw map events
	// for all callers, including address pickers that do not fetch accommodations.
	// This debounce reduces requests from normal interaction. Server-side abuse
	// protection is separate, since a client can bypass this timer.
	let boundsTimer: ReturnType<typeof setTimeout> | undefined;

	// GoogleMap calls this when the map becomes idle. Wait another 400 ms before
	// applying these bounds so brief pauses between pans/zoom steps share one search.
	function handleBoundsChange(bounds: MapBounds): void {
		clearTimeout(boundsTimer);
		onMovingChange(true);
		boundsTimer = setTimeout(() => {
			boundsTimer = undefined;
			// Updating the page's bounds triggers the accommodation query.
			onBoundsChange(bounds);
			// The query's own loading state keeps the indicators visible until it finishes.
			onMovingChange(false);
		}, 400);
	}

	function handleMovingChange(moving: boolean): void {
		if (moving) {
			// New movement cancels the pending search for the previous area.
			clearTimeout(boundsTimer);
			boundsTimer = undefined;
			// Show skeletons and the Spinner immediately; this callback sends no request.
			onMovingChange(true);
		} else if (boundsTimer === undefined) {
			// An idle event must not hide loading while the debounce is still pending.
			onMovingChange(false);
		}
	}

	// Do not apply old bounds after leaving this map or selecting a new destination.
	onDestroy(() => clearTimeout(boundsTimer));

	const pinDestroyers: (() => void)[] = [];
	let pinGeneration: symbol | null = null;

	function clearPins(): void {
		for (const destroy of pinDestroyers) destroy();
		pinDestroyers.length = 0;
	}

	function buildStayPin(accommodation: PublicAccommodation, generation: symbol): HTMLElement {
		if (generation !== pinGeneration) {
			clearPins();
			pinGeneration = generation;
		}

		const pin = document.createElement('div');
		pin.className = 'flex flex-col items-center';
		const component = mount(SearchMapPin, {
			target: pin,
			props: {
				accommodation,
				isHighlighted: () => accommodation._id === highlightedId
			},
			context: contexts
		});
		pinDestroyers.push(() => void unmount(component));
		return pin;
	}

	onDestroy(clearPins);

	const googleMarkers = $derived.by(() => {
		// A fresh token per result set so pins from a previous set are unmounted first.
		const generation = Symbol();
		return markers.map((stay) => ({
			position: { lat: stay.latitude, lng: stay.longitude },
			title: stay.name,
			content: () => buildStayPin(stay, generation)
		}));
	});
</script>

{#if position}
	<aside
		class={cn(
			'relative min-[68.75rem]:sticky min-[68.75rem]:top-20 min-[68.75rem]:block',
			search.mapVisible ? 'block' : 'hidden'
		)}
		aria-busy={loading}
		{@attach () => {
			if (googleMarkers.length === 0) clearPins();
		}}
	>
		<GoogleMap
			markers={googleMarkers}
			{position}
			onBoundsChange={handleBoundsChange}
			onMovingChange={handleMovingChange}
			fitMarkers={false}
			showPositionMarker={false}
			disabled
			zoom={13}
			label={m['SearchPage.mapTitle']({ destination })}
			pinTitle={destination}
			loadingText={m['SearchPage.mapLoading']()}
			errorText={m['SearchPage.mapError']()}
			class="h-[calc(100dvh-17rem)] min-h-96 rounded-2xl sm:h-[calc(100dvh-17rem)] min-[68.75rem]:h-[calc(100dvh-7rem)]"
		/>
		{#if loading}
			<SearchMapLoading />
		{/if}
	</aside>
{/if}
