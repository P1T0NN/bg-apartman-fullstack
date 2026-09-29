// SVELTEKIT IMPORTS
import { env } from '$env/dynamic/public';

// LIBRARIES
import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import { SvelteMap } from 'svelte/reactivity';
import { untrack } from 'svelte';

// TYPES
import type { Attachment } from 'svelte/attachments';
import type { MarkerClusterer } from '@googlemaps/markerclusterer';

export type Position = { lat: number; lng: number };
export type MapBounds = google.maps.LatLngBoundsLiteral;

export type MapMarkerContent = {
	element: HTMLElement;
	destroy?: () => void;
};

export type MapMarker = {
	id: PropertyKey;
	position: Position;
	title?: string;
	/** Recreate content only when this value changes. */
	contentKey?: unknown;
	/** Builds the marker's DOM content on demand (browser-only). */
	content?: () => MapMarkerContent;
};

type ManagedMapMarker = {
	element: google.maps.marker.AdvancedMarkerElement;
	generation: number;
	content?: MapMarkerContent;
	contentKey?: unknown;
	contentFactory?: MapMarker['content'];
};

export type GoogleMapConfig = {
	getPosition: () => Position | null;
	getMarkers: () => MapMarker[];
	getHighlightedMarkerId?: () => PropertyKey | null;
	getPinTitle: () => string;
	getDisabled: () => boolean;
	getZoom: () => number;
	getFitMarkers?: () => boolean;
	getClusterMarkers?: () => boolean;
	getShowPositionMarker?: () => boolean;
	onBoundsChange?: (bounds: MapBounds) => void;
	onMovingChange?: (moving: boolean) => void;
	onPositionChange: (position: Position) => void;
};

// Custom marker content sits inside Google's map DOM, so gestures that start in
// it (buttons, carousels, popovers) would otherwise pan or zoom the map. Stop
// only gesture starts: a map drag that ends over a marker still has to finish.
const MAP_GESTURE_EVENTS = [
	'mousedown',
	'pointerdown',
	'touchstart',
	'click',
	'dblclick',
	'wheel'
] as const;

function stopMapGesture(event: Event): void {
	event.stopPropagation();
}

function blockMapGestures(element: HTMLElement): void {
	for (const type of MAP_GESTURE_EVENTS) element.addEventListener(type, stopMapGesture);
}

let loaderConfigured = false;

/**
 * Owns the Google Maps instance, marker lifecycle, and cloud syncing for
 * `google-map.svelte`. Changing component props arrive as getters, and the
 * returned attachments re-run whenever the state they read changes.
 */
export function useGoogleMap(options: GoogleMapConfig) {
	let map: google.maps.Map | undefined;
	let marker: google.maps.marker.AdvancedMarkerElement | undefined;
	let markerClusterer: MarkerClusterer | undefined;
	const managedMarkers = new SvelteMap<PropertyKey, ManagedMapMarker>();
	const clusterContentsByMarker = new WeakMap<
		google.maps.marker.AdvancedMarkerElement,
		HTMLElement
	>();
	let loaded = $state(false);
	let failed = $state(false);
	let previousPosition: Position | null = null;
	let previousZoom: number | undefined;
	let markerGeneration = 0;
	let highlightedMarkerId: PropertyKey | null = null;
	let highlightedClusterContent: HTMLElement | undefined;
	let clusteredMarkerPositions: { id: PropertyKey; lat: number; lng: number }[] = [];

	function setClusterHighlight(content: HTMLElement, highlighted: boolean): void {
		content.classList.toggle('border-background', !highlighted);
		content.classList.toggle('border-primary', highlighted);
		content.classList.toggle('bg-primary', !highlighted);
		content.classList.toggle('bg-primary-foreground', highlighted);
		content.classList.toggle('text-primary-foreground', !highlighted);
		content.classList.toggle('text-primary', highlighted);
	}

	// Update directly because MarkerClusterer skips unchanged layouts.
	function syncHighlightedCluster(markerId: PropertyKey | null): void {
		if (highlightedClusterContent) setClusterHighlight(highlightedClusterContent, false);
		highlightedClusterContent = undefined;
		if (markerId === null) return;

		const marker = untrack(() => managedMarkers.get(markerId)?.element);
		const content = marker ? clusterContentsByMarker.get(marker) : undefined;
		if (!marker || marker.map !== null || !content) return;

		highlightedClusterContent = content;
		setClusterHighlight(content, true);
	}

	function disposeMarkerContent(managed: ManagedMapMarker): void {
		managed.content?.destroy?.();
		managed.content?.element.remove();
		managed.content = undefined;
	}

	function disposeMarker(managed: ManagedMapMarker): void {
		managed.element.map = null;
		disposeMarkerContent(managed);
	}

	function syncMarkerContent(managed: ManagedMapMarker, item: MapMarker): void {
		const sameContent =
			item.contentKey !== undefined
				? managed.contentKey === item.contentKey
				: managed.contentKey === undefined && managed.contentFactory === item.content;
		if (sameContent) return;

		disposeMarkerContent(managed);
		managed.contentKey = item.contentKey;
		managed.contentFactory = item.content;
		managed.content = item.content?.();
		if (managed.content) {
			blockMapGestures(managed.content.element);
			managed.element.append(managed.content.element);
		}
	}

	const initialize: Attachment<HTMLDivElement> = (element) => {
		let removed = false;
		let mapClick: google.maps.MapsEventListener | undefined;
		let boundsChange: google.maps.MapsEventListener | undefined;
		let idle: google.maps.MapsEventListener | undefined;
		const handleDragEnd = () => {
			if (options.getDisabled() || !marker?.position) return;
			// SAFETY: a dragged AdvancedMarkerElement reports numeric latitude and longitude.
			const point = marker.position as google.maps.LatLngAltitude;
			options.onPositionChange({ lat: point.lat, lng: point.lng });
		};

		void (async () => {
			const key = env.PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
			if (!key) {
				failed = true;
				return;
			}

			try {
				if (!loaderConfigured) {
					setOptions({ key, v: 'weekly' });
					loaderConfigured = true;
				}
				const [{ Map }, { AdvancedMarkerElement }] = await Promise.all([
					importLibrary('maps'),
					importLibrary('marker')
				]);
				if (removed) return;

				map = new Map(element, {
					center: { lat: 20, lng: 0 },
					zoom: 2,
					// TODO: Create a JavaScript Map ID in Google Cloud Console > Map Management
					// and set PUBLIC_GOOGLE_MAPS_MAP_ID for production. The API key is separate.
					mapId: env.PUBLIC_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID',
					streetViewControl: false,
					mapTypeControl: false
				});
				if (options.getClusterMarkers?.()) {
					const { MarkerClusterer } = await import('@googlemaps/markerclusterer');
					if (removed) return;
					markerClusterer = new MarkerClusterer({
						map,
						renderer: {
							render: ({ count, position, markers: clusterMarkers }) => {
								const content = document.createElement('span');
								content.className =
									'flex size-11 items-center justify-center rounded-full border-2 px-2 text-sm font-semibold shadow-lg';
								const activeMarkerId = highlightedMarkerId;
								const highlightedMarker =
									activeMarkerId === null
										? undefined
										: untrack(() => managedMarkers.get(activeMarkerId)?.element);
								let isHighlighted = false;
								for (const clusterMarker of clusterMarkers) {
									// SAFETY: this clusterer receives only AdvancedMarkerElement instances created below.
									const accommodationMarker =
										clusterMarker as google.maps.marker.AdvancedMarkerElement;
									clusterContentsByMarker.set(accommodationMarker, content);
									if (accommodationMarker === highlightedMarker) isHighlighted = true;
								}
								setClusterHighlight(content, isHighlighted);
								if (isHighlighted) {
									if (highlightedClusterContent && highlightedClusterContent !== content) {
										setClusterHighlight(highlightedClusterContent, false);
									}
									highlightedClusterContent = content;
								}
								content.textContent = String(count);
								content.setAttribute('aria-label', `${count} accommodations`);
								return new AdvancedMarkerElement({
									position,
									content,
									title: `${count} accommodations`,
									gmpClickable: true,
									zIndex: 1000 + count
								});
							}
						}
					});
				}

				marker = new AdvancedMarkerElement({
					map,
					gmpDraggable: !options.getDisabled(),
					title: options.getPinTitle()
				});

				mapClick = map.addListener('click', (event: google.maps.MapMouseEvent) => {
					if (!options.getDisabled() && event.latLng) {
						options.onPositionChange({ lat: event.latLng.lat(), lng: event.latLng.lng() });
					}
				});

				marker.addEventListener('gmp-dragend', handleDragEnd);
				boundsChange = map.addListener('bounds_changed', () => {
					if (!element.clientWidth || !element.clientHeight) return;
					untrack(() => options.onMovingChange?.(true));
				});
				idle = map.addListener('idle', () => {
					const bounds = map?.getBounds();
					untrack(() => {
						// Hidden mobile maps have no useful viewport until they are shown.
						const hasViewport = bounds && element.clientWidth > 0 && element.clientHeight > 0;
						if (hasViewport) options.onBoundsChange?.(bounds.toJSON());
						options.onMovingChange?.(false);
					});
				});

				loaded = true;
			} catch {
				if (!removed) failed = true;
			}
		})();

		return () => {
			removed = true;
			mapClick?.remove();
			boundsChange?.remove();
			idle?.remove();
			markerClusterer?.setMap(null);
			markerClusterer = undefined;
			clusteredMarkerPositions = [];
			for (const managed of untrack(() => [...managedMarkers.values()])) disposeMarker(managed);
			untrack(() => managedMarkers.clear());
			if (marker) {
				marker.removeEventListener('gmp-dragend', handleDragEnd);
				marker.map = null;
			}
			marker = undefined;
			map = undefined;
		};
	};

	const syncPosition: Attachment<HTMLDivElement> = () => {
		if (!loaded || !map || !marker) return;
		const next = options.getPosition();
		marker.position = (options.getShowPositionMarker?.() ?? true) ? next : null;
		const zoom = options.getZoom();
		const positionChanged =
			next?.lat !== previousPosition?.lat || next?.lng !== previousPosition?.lng;
		const cameraChanged = positionChanged || zoom !== previousZoom;
		previousPosition = next;
		previousZoom = zoom;
		if (next && cameraChanged) {
			map.panTo(next);
			map.setZoom(zoom);
		}
	};

	const syncMarkers: Attachment<HTMLDivElement> = () => {
		if (!loaded || !map) return;
		const next = options.getMarkers();
		const generation = ++markerGeneration;
		const nextClusterMarkers: google.maps.marker.AdvancedMarkerElement[] = [];
		for (const item of next) {
			let managed = untrack(() => managedMarkers.get(item.id));
			if (!managed) {
				const created: ManagedMapMarker = {
					element: new google.maps.marker.AdvancedMarkerElement({
						map: markerClusterer ? null : map
					}),
					generation
				};
				managed = created;
				untrack(() => managedMarkers.set(item.id, created));
			}
			managed.generation = generation;
			managed.element.position = item.position;
			managed.element.title = item.title ?? '';
			syncMarkerContent(managed, item);
			nextClusterMarkers.push(managed.element);
		}
		for (const [id, managed] of untrack(() => [...managedMarkers.entries()])) {
			if (managed.generation === generation) continue;
			disposeMarker(managed);
			untrack(() => managedMarkers.delete(id));
		}
		if (markerClusterer) {
			const nextMarkerPositions = next.map(({ id, position }) => ({
				id,
				lat: position.lat,
				lng: position.lng
			}));
			const clusterInputsChanged =
				nextMarkerPositions.length !== clusteredMarkerPositions.length ||
				nextMarkerPositions.some(
					(item, index) =>
						item.id !== clusteredMarkerPositions[index]?.id ||
						item.lat !== clusteredMarkerPositions[index]?.lat ||
						item.lng !== clusteredMarkerPositions[index]?.lng
				);
			if (clusterInputsChanged) {
				markerClusterer.clearMarkers(true);
				markerClusterer.addMarkers(nextClusterMarkers, true);
				markerClusterer.render();
				clusteredMarkerPositions = nextMarkerPositions;
				syncHighlightedCluster(highlightedMarkerId);
			}
		}
		const shouldFitMarkers = next.length > 0 && (options.getFitMarkers?.() ?? true);
		if (!shouldFitMarkers) return;

		if (next.length === 1) {
			map.setCenter(next[0].position);
			map.setZoom(options.getZoom());
			return;
		}

		const bounds = new google.maps.LatLngBounds();
		for (const item of next) bounds.extend(item.position);
		map.fitBounds(bounds, 64);
	};

	const syncHighlightedMarker: Attachment<HTMLDivElement> = () => {
		if (!loaded) return;
		const nextHighlightedMarkerId = options.getHighlightedMarkerId?.() ?? null;
		if (nextHighlightedMarkerId === highlightedMarkerId) return;
		highlightedMarkerId = nextHighlightedMarkerId;
		syncHighlightedCluster(nextHighlightedMarkerId);
	};

	const syncDisabled: Attachment<HTMLDivElement> = () => {
		if (loaded && marker) marker.gmpDraggable = !options.getDisabled();
	};

	return {
		get loaded() {
			return loaded;
		},
		get failed() {
			return failed;
		},
		initialize,
		syncPosition,
		syncMarkers,
		syncHighlightedMarker,
		syncDisabled
	};
}
