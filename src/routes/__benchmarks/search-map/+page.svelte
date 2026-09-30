<script lang="ts">
	// LIBRARIES
	import { onMount, tick, untrack } from 'svelte';
	import { getConvexClient } from 'convex-svelte';
	import { getFunctionName } from 'convex/server';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import SearchMapBenchmarkHeader from '@/components/pages/__benchmarks/search-map/search-map-benchmark-header.svelte';
	import SearchMap from '@/components/pages/(unprotected)/search/search-map/search-map.svelte';

	// HOOKS
	import { useSearchAccommodations } from '@/features/search/hooks/useSearchAccommodations.svelte.js';
	import { useSearchCriteria } from '@/features/search/hooks/useSearchCriteria.svelte.js';
	import { setSearchContext } from '@/features/search/context/searchContext.js';
	import { useFavorites } from '@/features/favorites/hooks/useFavorites.svelte.js';
	import { setFavoritesContext } from '@/features/favorites/context/favoritesContext.js';

	// TYPES
	import type { MapBounds } from '@/components/ui/custom-components/google-components/google-map/useGoogleMap.svelte.js';

	const criteria = useSearchCriteria({ hasLocation: () => true });
	criteria.toggleMap();
	setSearchContext(criteria);
	let bounds = $state<MapBounds>();
	let adults = $state(0);
	let rooms = $state(0);
	let running = $state(false);
	let output = $state('Waiting for the map.');
	let mapReady = false;
	let queryCalls = 0;
	let responseBytes = 0;
	let queryMs = 0;
	let lastQueryEnd = 0;
	const accommodations = useSearchAccommodations(() => ({ location: {}, bounds, adults, rooms }), {
		pageSize: 9
	});
	setFavoritesContext(useFavorites({ viewerId: () => null }));

	async function nextFrame(): Promise<void> {
		await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
	}

	/** One warm-map viewport sample. Excludes tiles, map SDK loading and pan animation. */
	async function run(guestMinimum = 0, bedroomMinimum = 0, narrow = false) {
		if (running || !mapReady) throw new Error('Map is not ready or a sample is running.');
		running = true;
		queryCalls = 0;
		responseBytes = 0;
		queryMs = 0;
		lastQueryEnd = 0;
		const startedAt = Date.now();
		const start = performance.now();
		try {
			// Include the same 400 ms settling delay as SearchMap. The bounds change
			// itself is synthetic; real pan/zoom animation is measured separately.
			await new Promise((resolve) => setTimeout(resolve, 400));
			adults = guestMinimum;
			rooms = bedroomMinimum;
			// A sub-metre change prevents identical query cache hits without changing
			// fixture membership (seed coordinates have a margin inside the bounds).
			const jitter = Math.random() * 0.000001;
			bounds = {
				south: 44.77 + jitter,
				north: 44.86 + jitter,
				west: narrow ? 20.4512 : 20.4,
				east: narrow ? 20.4712 : 20.53
			};
			await tick();
			const deadline = performance.now() + 120_000;
			while (accommodations.mapLoading || accommodations.loading) {
				if (performance.now() > deadline) throw new Error('Viewport sample timed out.');
				await new Promise((resolve) => setTimeout(resolve, 10));
			}
			if (accommodations.mapError) throw accommodations.mapError;
			if (accommodations.error) throw accommodations.error;
			await tick();
			await nextFrame();
			await nextFrame();
			const end = performance.now();
			const sample = {
				startedAt,
				finishedAt: Date.now(),
				guestMinimum,
				bedroomMinimum,
				narrow,
				queryCalls,
				responseBytes,
				queryMs,
				markerCount: accommodations.mapData.length,
				listCount: accommodations.data.length,
				renderMs: end - lastQueryEnd,
				viewportUpdateMs: end - start,
				userAgent: navigator.userAgent
			};
			output = JSON.stringify(sample, null, 2);
			return sample;
		} finally {
			running = false;
		}
	}

	onMount(() => {
		const client = getConvexClient();
		const originalQuery = client.query;
		client.query = async function (query, args, ...rest) {
			const isMapQuery = getFunctionName(query).endsWith(
				'fetchAccommodationsMapSearch:fetchAccommodationsMap'
			);
			const measure = untrack(() => running && isMapQuery);
			const start = performance.now();
			const result = await originalQuery.call(client, query, args, ...rest);
			if (measure) {
				lastQueryEnd = performance.now();
				queryMs += lastQueryEnd - start;
				queryCalls++;
				// Application JSON bytes, excluding WebSocket framing and compression.
				responseBytes += new TextEncoder().encode(JSON.stringify(result)).byteLength;
			}
			return result;
		};
		Object.assign(window, { searchMapBenchmark: { run } });
		return () => {
			client.query = originalQuery;
			Reflect.deleteProperty(window, 'searchMapBenchmark');
		};
	});

	function markReady(): void {
		mapReady = true;
		if (!running) output = 'Ready. Run a sample or use the benchmark script.';
	}

	async function runSample(): Promise<void> {
		try {
			await run();
		} catch (cause) {
			output = String(cause);
		}
	}
</script>

<svelte:head>
	<title>Search map benchmark</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="mx-auto max-w-6xl p-6">
	<SearchMapBenchmarkHeader />
	<Button onclick={runSample} disabled={running}>Run viewport sample</Button>
	<pre class="my-4 overflow-auto text-sm" aria-live="polite">{output}</pre>
	<div
		{@attach accommodations.load(accommodations.key, null)}
		{@attach accommodations.loadMap(accommodations.key, Boolean(bounds))}
	>
		<SearchMap
			destination="Belgrade"
			position={{ lat: 44.8125, lng: 20.4612 }}
			markers={accommodations.mapData}
			accommodations={accommodations.data}
			onBoundsChange={markReady}
			onMovingChange={() => {}}
		/>
	</div>
</main>
