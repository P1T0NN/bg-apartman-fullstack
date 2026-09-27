// SVELTEKIT IMPORTS
import { env } from '$env/dynamic/public';

// LIBRARIES
import { importLibrary, setOptions } from '@googlemaps/js-api-loader';

// TYPES
import type { Attachment } from 'svelte/attachments';

export type Position = { lat: number; lng: number };

export type MapMarker = {
	position: Position;
	title?: string;
	/** Builds the marker's DOM content on demand (browser-only); omit for the default pin. */
	content?: () => HTMLElement;
};

export type GoogleMapConfig = {
	getPosition: () => Position | null;
	getMarkers: () => MapMarker[];
	getPinTitle: () => string;
	getDisabled: () => boolean;
	getZoom: () => number;
	onPositionChange: (position: Position) => void;
};

let loaderConfigured = false;

/**
 * Owns the Google Maps instance, marker lifecycle, and cloud syncing for
 * `google-map.svelte`. Changing component props arrive as getters, and the
 * returned attachments re-run whenever the state they read changes.
 */
export function useGoogleMap(options: GoogleMapConfig) {
	let map: google.maps.Map | undefined;
	let marker: google.maps.marker.AdvancedMarkerElement | undefined;
	let markerElements: google.maps.marker.AdvancedMarkerElement[] = [];
	let loaded = $state(false);
	let failed = $state(false);

	const initialize: Attachment<HTMLDivElement> = (element) => {
		let removed = false;
		let mapClick: google.maps.MapsEventListener | undefined;
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

				loaded = true;
			} catch {
				if (!removed) failed = true;
			}
		})();

		return () => {
			removed = true;
			mapClick?.remove();
			for (const markerElement of markerElements) markerElement.map = null;
			markerElements = [];
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
		marker.position = next;
		if (next) {
			map.panTo(next);
			map.setZoom(options.getZoom());
		}
	};

	const syncMarkers: Attachment<HTMLDivElement> = () => {
		if (!loaded || !map) return;
		const next = options.getMarkers();
		for (const markerElement of markerElements) markerElement.map = null;
		markerElements = next.map((item) => {
			const markerElement = new google.maps.marker.AdvancedMarkerElement({
				map,
				position: item.position,
				title: item.title
			});
			const content = item.content?.();
			if (content) markerElement.append(content);
			return markerElement;
		});
		if (next.length === 0) return;

		if (next.length === 1) {
			map.setCenter(next[0].position);
			map.setZoom(options.getZoom());
			return;
		}

		const bounds = new google.maps.LatLngBounds();
		for (const item of next) bounds.extend(item.position);
		map.fitBounds(bounds, 64);
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
		syncDisabled
	};
}
