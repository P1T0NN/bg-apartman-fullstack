// SVELTEKIT IMPORTS
import { untrack } from 'svelte';

// LIBRARIES
import { getConvexClient } from 'convex-svelte';
import { api } from '@convex/_generated/api';

// UTILS
import { ACCOMMODATION_CONFIG } from '@/shared/features/accommodations/config.js';
import { appendUniquePaginationItems } from '@/shared/features/pagination/utils/appendUniquePaginationItems.js';
import { normalizePageSize } from '@/shared/features/pagination/utils/normalizePageSize.js';

// TYPES
import type { FunctionArgs, FunctionReturnType } from 'convex/server';
import type { Attachment } from 'svelte/attachments';
import type { Id } from '@convex/_generated/dataModel';
import type { AccommodationSort } from '@/shared/features/accommodations/types/accommodationTypes.js';

const searchQuery =
	api.tables.accommodations.queries.fetchAccommodationsSearch.fetchAccommodationsSearch;
const mapSearchQuery =
	api.tables.accommodations.queries.fetchAccommodationsMapSearch.fetchAccommodationsMap;
type SearchQuery = typeof searchQuery;
type MapSearchQuery = typeof mapSearchQuery;
type SearchArgs = Pick<
	FunctionArgs<SearchQuery>,
	'location' | 'bounds' | 'adults' | 'children' | 'rooms' | 'stayFilters'
>;
type SearchPage = FunctionReturnType<SearchQuery>;
type SearchItem = SearchPage['items'][number];
type MapSearchPage = FunctionReturnType<MapSearchQuery>;
type MapSearchItem = MapSearchPage['items'][number];
type FailedRequest = { cursor: string | null; append: boolean };

/**
 * One-shot cursor pagination for the search page: no live subscription, no
 * `$effect`. The returned `load` attachment fetches page one whenever its
 * arguments change, so new searches and sign-in state share one explicit trigger.
 */
export function useSearchAccommodations(
	args: () => SearchArgs,
	options: {
		pageSize?: number;
		isMapMoving?: () => boolean;
		sort?: () => AccommodationSort;
	} = {}
) {
	const pageSize = normalizePageSize(options.pageSize);
	const mapKey = $derived(JSON.stringify(args()));
	const key = $derived(
		JSON.stringify({
			...args(),
			sort: options.sort?.() ?? 'recommended'
		})
	);

	let data = $state.raw<SearchItem[]>([]);
	let mapData = $state.raw<MapSearchItem[]>([]);
	let favoriteIds = $state.raw<Id<'accommodations'>[]>([]);
	let nextCursor = $state<string | null>(null);
	let total = $state<number | undefined>(undefined);
	let loading = $state(true);
	let mapLoading = $state(false);
	let loadingMore = $state(false);
	let requestedKey = $state('');
	let error = $state<unknown>(undefined);
	let mapError = $state<unknown>(undefined);
	let requestId = 0;
	let mapRequestId = 0;
	let failedRequest: FailedRequest | undefined;
	let failedMapKey: string | undefined;
	let requestedMapKey = '';

	async function fetchPage(cursor: string | null, append: boolean, argsKey: string): Promise<void> {
		const request = ++requestId;
		requestedKey = argsKey;
		// SAFETY: The query validator requires paginationOpts, which Convex validates before the handler runs.
		const requestArgs = {
			...untrack(args),
			sort: untrack(() => options.sort?.() ?? 'recommended'),
			paginationOpts: { cursor, numItems: pageSize }
		} as FunctionArgs<SearchQuery>;

		if (append) {
			loadingMore = true;
		} else loading = true;

		error = undefined;
		failedRequest = undefined;

		try {
			let items: SearchItem[] = [];
			let pageFavoriteIds: Id<'accommodations'>[] = [];
			let nextPageCursor = cursor;
			let result: SearchPage;

			do {
				requestArgs.paginationOpts.cursor = nextPageCursor;
				requestArgs.paginationOpts.numItems = pageSize - items.length;
				result = await getConvexClient().query(searchQuery, requestArgs);

				if (request !== requestId) return;

				// Continue bounded scans until this visible batch is full or the cursor is exhausted.
				items = appendUniquePaginationItems(items, result.items, (item) => item._id);

				pageFavoriteIds = appendUniquePaginationItems(
					pageFavoriteIds,
					result.favoriteIds,
					(id) => id
				);

				nextPageCursor = result.nextCursor;
			} while (items.length < pageSize && nextPageCursor !== null);

			if (request !== requestId || requestedKey !== key) return;

			data = append ? appendUniquePaginationItems(data, items, (item) => item._id) : items;

			favoriteIds = append
				? appendUniquePaginationItems(favoriteIds, pageFavoriteIds, (id) => id)
				: pageFavoriteIds;

			nextCursor = result.nextCursor;
			total = result.total;
		} catch (cause) {
			if (request !== requestId) return;
			error = cause;
			failedRequest = { cursor, append };
		} finally {
			if (request === requestId) {
				loading = false;
				loadingMore = false;
			}
		}
	}

	async function fetchMapData(argsKey: string): Promise<void> {
		const request = ++mapRequestId;
		requestedMapKey = argsKey;
		// SAFETY: The map query requires pagination options validated by Convex.
		const requestArgs = {
			...untrack(args),
			paginationOpts: { cursor: null, numItems: ACCOMMODATION_CONFIG.mapSearchPageSize }
		} as FunctionArgs<MapSearchQuery>;

		mapLoading = true;
		mapError = undefined;
		failedMapKey = undefined;

		try {
			let items: MapSearchItem[] = [];
			let nextPageCursor: string | null = null;

			do {
				requestArgs.paginationOpts.cursor = nextPageCursor;
				const result = await getConvexClient().query(mapSearchQuery, requestArgs);

				if (request !== mapRequestId) return;

				// Continue through empty partial pages until the map's cursor is exhausted.
				items = appendUniquePaginationItems(items, result.items, (item) => item._id);
				nextPageCursor = result.nextCursor;
			} while (nextPageCursor !== null);

			if (request !== mapRequestId || requestedMapKey !== mapKey || argsKey !== mapKey) return;

			mapData = items;
		} catch (cause) {
			if (request !== mapRequestId) return;
			mapError = cause;
			failedMapKey = argsKey;
		} finally {
			if (request === mapRequestId) mapLoading = false;
		}
	}

	function load(argsKey: string, viewerId: string | null): Attachment<HTMLElement> {
		return () => {
			// These arguments are the reactive dependencies; the body only writes state.
			void argsKey;
			void viewerId;
			data = [];
			favoriteIds = [];
			nextCursor = null;
			total = undefined;
			error = undefined;
			loading = true;
			loadingMore = false;
			void fetchPage(null, false, argsKey);
			return () => {
				requestId++;
			};
		};
	}

	function loadMap(argsKey: string, enabled: boolean): Attachment<HTMLElement> {
		return () => {
			void argsKey;
			void enabled;
			mapRequestId++;
			requestedMapKey = argsKey;
			mapData = [];
			mapError = undefined;
			failedMapKey = undefined;
			mapLoading = enabled;

			if (enabled) void fetchMapData(argsKey);

			return () => {
				mapRequestId++;
			};
		};
	}

	function loadMore(): void {
		if (
			loading ||
			loadingMore ||
			requestedKey !== key ||
			options.isMapMoving?.() ||
			nextCursor === null
		) {
			return;
		}
		void fetchPage(nextCursor, true, key);
	}

	function retry(): void {
		if (!failedRequest) return;
		void fetchPage(failedRequest.cursor, failedRequest.append, key);
	}

	function retryMap(): void {
		if (failedMapKey !== mapKey) return;
		void fetchMapData(mapKey);
	}

	return {
		get key() {
			return key;
		},
		get mapKey() {
			return mapKey;
		},
		get data() {
			return data;
		},
		get mapData() {
			return mapData;
		},
		get loading() {
			return loading || requestedKey !== key || (options.isMapMoving?.() ?? false);
		},
		get loadingMore() {
			return loadingMore;
		},
		get mapLoading() {
			return mapLoading || requestedMapKey !== mapKey;
		},
		get mapError() {
			return requestedMapKey !== mapKey || options.isMapMoving?.() ? undefined : mapError;
		},
		get error() {
			return requestedKey !== key || options.isMapMoving?.() ? undefined : error;
		},
		get hasNextPage() {
			return requestedKey === key && nextCursor !== null;
		},
		get total() {
			return total;
		},
		get favoriteIds() {
			return favoriteIds;
		},
		load,
		loadMap,
		loadMore,
		retry,
		retryMap
	};
}
