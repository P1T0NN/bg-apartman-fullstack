// SVELTEKIT IMPORTS
import { pushState, replaceState } from '$app/navigation';
import { page } from '$app/state';

/**
 * Universal URL search-params plumbing. `keys` are the params this hook
 * *owns*: `write` updates only them and preserves every other param, the
 * pathname and the hash. Reading is unrestricted — `get`/`read` work for any
 * key. Callers keep their own `$state` (debounce, min-chars, mode) on top.
 *
 * Writes are shallow (`pushState`/`replaceState`), so SvelteKit leaves
 * `page.url` — and therefore `get`/`read` — at the last navigated URL. Keep
 * your own `$state` for the values you write; URL is the shareable seed.
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
	const get = (key: string): string | null => page.url.searchParams.get(key);

	const read = (key: string): string => get(key) ?? '';

	function setOwnedParams(params: URLSearchParams, values: Record<string, string>): void {
		for (const key of getKeys()) {
			params.delete(key);
			const value = values[key];
			if (value) params.set(key, value);
		}
	}

	function buildUrl(values: Record<string, string>): string {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- Mutable URL is intentional while building the navigation target.
		const url = new URL(window.location.href);
		setOwnedParams(url.searchParams, values);
		return `${url.pathname}${url.search}${url.hash}`;
	}

	function href(pathname: string, values: Record<string, string>): string {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- Mutable URLSearchParams is intentional while building the navigation target.
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
		}
	}

	function onPopState(callback: () => void): () => void {
		const handler = () => callback();
		window.addEventListener('popstate', handler);
		return () => window.removeEventListener('popstate', handler);
	}

	return { get, read, write, href, onPopState };
}
