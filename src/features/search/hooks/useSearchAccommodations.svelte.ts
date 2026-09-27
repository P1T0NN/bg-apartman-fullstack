// LIBRARIES
import { getConvexClient } from 'convex-svelte';
import { untrack } from 'svelte';

// CONVEX
import { api } from '@convex/_generated/api';

// UTILS
import { normalizePageSize } from '@/shared/features/pagination/utils/normalizePageSize.js';

// TYPES
import type { FunctionArgs, FunctionReturnType } from 'convex/server';
import type { Attachment } from 'svelte/attachments';
import type { Id } from '@convex/_generated/dataModel';

const searchQuery =
	api.tables.accommodations.queries.fetchAccommodationsSearch.fetchAccommodationsSearch;
type SearchQuery = typeof searchQuery;
type SearchArgs = Pick<FunctionArgs<SearchQuery>, 'location' | 'adults' | 'children' | 'rooms'>;
type SearchPage = FunctionReturnType<SearchQuery>;
type SearchItem = SearchPage['items'][number];

/**
 * One-shot cursor pagination for the search page: no live subscription, no
 * `$effect`. The returned `load` attachment fetches page one whenever its
 * arguments change, so new searches and sign-in state share one explicit trigger.
 */
export function useSearchAccommodations(
	args: () => SearchArgs,
	options: { pageSize?: number } = {}
) {
	const pageSize = normalizePageSize(options.pageSize);
	const key = $derived(JSON.stringify(args()));

	let page = $state(1);
	let cursors = $state<Record<number, string | null>>({ 1: null });
	let data = $state<SearchItem[]>([]);
	let favoriteIds = $state<Id<'accommodations'>[]>([]);
	let nextCursor = $state<string | null>(null);
	let total = $state<number | undefined>(undefined);
	let loading = $state(true);
	let error = $state<unknown>(undefined);
	let requestId = 0;

	async function fetchPage(targetPage: number): Promise<void> {
		const request = ++requestId;
		const cursor = untrack(() => cursors[targetPage] ?? null);
		// SAFETY: The query validator requires paginationOpts, which Convex validates before the handler runs.
		const requestArgs = {
			...untrack(args),
			paginationOpts: { cursor, numItems: pageSize }
		} as FunctionArgs<SearchQuery>;

		loading = true;
		error = undefined;
		try {
			const result = await getConvexClient().query(searchQuery, requestArgs);
			if (request !== requestId) return;
			page = targetPage;
			data = result.items;
			favoriteIds = result.favoriteIds;
			nextCursor = result.nextCursor;
			total = result.total;
		} catch (cause) {
			if (request !== requestId) return;
			error = cause;
		} finally {
			if (request === requestId) loading = false;
		}
	}

	function load(argsKey: string, viewerId: string | null): Attachment<HTMLElement> {
		return () => {
			// These arguments are the reactive dependencies; the body only writes state.
			void argsKey;
			void viewerId;
			page = 1;
			cursors = { 1: null };
			void fetchPage(1);
		};
	}

	function onPrev(): void {
		if (page <= 1) return;
		void fetchPage(page - 1);
	}

	function onNext(): void {
		if (nextCursor === null) return;
		const targetPage = page + 1;
		cursors = { ...cursors, [targetPage]: nextCursor };
		void fetchPage(targetPage);
	}

	function retry(): void {
		void fetchPage(page);
	}

	return {
		get key() {
			return key;
		},
		get page() {
			return page;
		},
		get data() {
			return data;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		get nextCursor() {
			return nextCursor;
		},
		get pageSize() {
			return pageSize;
		},
		get total() {
			return total;
		},
		get favoriteIds() {
			return favoriteIds;
		},
		load,
		onPrev,
		onNext,
		retry
	};
}
