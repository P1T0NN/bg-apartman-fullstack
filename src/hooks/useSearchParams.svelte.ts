// SVELTEKIT IMPORTS
import { pushState, replaceState } from '$app/navigation';
import { page } from '$app/state';
import { browser } from '$app/environment';
import { createSubscriber } from 'svelte/reactivity';

const SEARCH_PARAMS_CHANGE_EVENT = 'app:search-params-change';

/**
 * Universal URL search-params plumbing. `keys` are the params this hook
 * *owns*: `write` updates only them and preserves every other param, the
 * pathname and the hash. Reading is unrestricted — `get`/`read` work for any
 * key. Callers keep their own `$state` (debounce, min-chars, mode) on top.
 *
 * Writes are shallow (`pushState`/`replaceState`). Reads use the browser's
 * current URL and react to shallow writes and back/forward, even when
 * `page.url` is unchanged.
 *
 * `get(key)` — raw read (`string | null`, matches `URLSearchParams.get`).
 * `read(key)` — read with `''` fallback (the string url-mode state wants).
 * `write(values)` updates the owned params (replace history by default; pass
 * `{ history: 'push' }` when each change should create a history entry).
 * `href(pathname, values)` — link target for the owned params (only non-empty
 * values) on another route; for anchors or `goto`.
 * `onPopState(cb)` — re-run `cb` on back/forward; returns the cleanup.
 */
export function useSearchParams(
	keys: string[] | (() => string[]) = [],
	{ history = 'replace' }: { history?: 'replace' | 'push' } = {}
) {
	const getKeys = Array.isArray(keys) ? () => keys : keys;
	const subscribeToHistory = createSubscriber((update) => {
		const unsubscribe = onPopState(update);
		window.addEventListener(SEARCH_PARAMS_CHANGE_EVENT, update);
		return () => {
			unsubscribe();
			window.removeEventListener(SEARCH_PARAMS_CHANGE_EVENT, update);
		};
	});
	const get = (key: string): string | null => {
		subscribeToHistory();
		// Track full SvelteKit navigations as well as shallow history changes.
		const url = page.url;
		return (browser ? new URL(window.location.href) : url).searchParams.get(key);
	};

	const read = (key: string): string => get(key) ?? '';

	function setOwnedParams(params: URLSearchParams, values: Record<string, string>): void {
		for (const key of getKeys()) {
			params.delete(key);
			const value = values[key];
			if (value) params.set(key, value);
		}
	}

	function buildUrl(values: Record<string, string>): string {
		const url = new URL(window.location.href);
		setOwnedParams(url.searchParams, values);
		return `${url.pathname}${url.search}${url.hash}`;
	}

	function href(pathname: string, values: Record<string, string>): string {
		const params = new URLSearchParams();
		setOwnedParams(params, values);
		const search = params.toString();
		return search ? `${pathname}?${search}` : pathname;
	}

	function write(values: Record<string, string>): void {
		const url = buildUrl(values);
		const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
		if (url !== currentUrl) {
			// eslint-disable-next-line svelte/no-navigation-without-resolve -- This shared helper intentionally performs shallow URL navigation.
			(history === 'push' ? pushState : replaceState)(url, {});
			// Shallow navigation does not update page.url or emit popstate.
			window.dispatchEvent(new Event(SEARCH_PARAMS_CHANGE_EVENT));
		}
	}

	function onPopState(callback: () => void): () => void {
		const handler = () => callback();
		window.addEventListener('popstate', handler);
		return () => window.removeEventListener('popstate', handler);
	}

	return { get, read, write, href, onPopState };
}
