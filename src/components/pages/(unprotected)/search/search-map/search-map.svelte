<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime.js';
	import { getAllContexts, mount, onDestroy, unmount } from 'svelte';

	// CONTEXTS
	import { getSearchContext } from '@/features/search/context/searchContext.js';

	// COMPONENTS
	import GoogleMap from '@/components/ui/custom-components/google-components/google-map/google-map.svelte';
	import SearchMapPin from './search-map-pin.svelte';
	import SearchMapLoading from '../loading/search-map-loading.svelte';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';
	import { formatCompactCurrency } from '@/shared/utils/currency.js';

	// TYPES
	import type {
		AccommodationCard,
		AccommodationMapMarker
	} from '@/shared/features/accommodations/types/accommodationTypes.js';
	import type {
		MapBounds,
		Position
	} from '@/components/ui/custom-components/google-components/google-map/useGoogleMap.svelte.js';

	let {
		destination,
		position,
		markers = [],
		accommodations = [],
		highlightedId = null,
		loading = false,
		mapError,
		retryMap = () => {},
		onBoundsChange,
		onMovingChange
	}: {
		destination: string;
		position: Position | null;
		markers?: AccommodationMapMarker[];
		accommodations?: AccommodationCard[];
		highlightedId?: string | null;
		loading?: boolean;
		mapError?: unknown;
		retryMap?: () => void;
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

	function buildStayPin(
		marker: AccommodationMapMarker,
		accommodation: AccommodationCard | undefined
	) {
		if (!accommodation) {
			const pin = document.createElement('div');
			pin.className = 'flex flex-col items-center';
			pin.title = marker.name;
			pin.setAttribute(
				'aria-label',
				`${marker.name}: ${formatCompactCurrency(marker.effectivePricePerNightMinor, getLocale())}`
			);

			const price = document.createElement('span');
			price.className =
				'flex min-w-11 items-center justify-center rounded-full border border-border bg-background px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-foreground shadow-md';
			price.textContent = `${m['AccommodationsFeature.Pricing.from']()} ${formatCompactCurrency(marker.effectivePricePerNightMinor, getLocale())}`;

			const pointer = document.createElement('span');
			pointer.className =
				'-mt-1.5 size-2.5 rotate-45 border-r border-b border-border bg-background';
			pin.append(price, pointer);
			return { element: pin };
		}

		const pin = document.createElement('div');
		pin.className = 'flex flex-col items-center';
		const component = mount(SearchMapPin, {
			target: pin,
			props: {
				accommodation,
				isHighlighted: () => marker._id === highlightedId
			},
			context: contexts
		});
		return {
			element: pin,
			destroy: () => void unmount(component)
		};
	}

	const accommodationById = $derived.by(
		() => new Map(accommodations.map((accommodation) => [accommodation._id, accommodation]))
	);
	const googleMarkers = $derived.by(() => {
		return markers.map((marker) => {
			const accommodation = accommodationById.get(marker._id);
			return {
				id: marker._id,
				position: { lat: marker.latitude, lng: marker.longitude },
				title: marker.name,
				contentKey: accommodation ?? marker,
				content: () => buildStayPin(marker, accommodation)
			};
		});
	});
</script>

{#if position}
	<aside
		class={cn(
			'relative min-[68.75rem]:sticky min-[68.75rem]:top-20 min-[68.75rem]:block',
			search.mapVisible ? 'block' : 'hidden'
		)}
		aria-busy={loading}
	>
		<GoogleMap
			markers={googleMarkers}
			highlightedMarkerId={highlightedId}
			clusterMarkers
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
		{#if !loading && !mapError && markers.length > 0}
			<div
				class="pointer-events-none absolute top-3 left-3 z-10 rounded-full border bg-background/95 px-3 py-1.5 text-sm font-medium shadow-sm"
			>
				{m['SearchPage.mapResultCount']({ count: markers.length })}
			</div>
		{/if}
		{#if mapError}
			<div
				class="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-background/90 px-4 backdrop-blur-sm"
			>
				<ErrorComponent message={m['SearchPage.error']()} retry={retryMap} />
			</div>
		{/if}
	</aside>
{/if}
