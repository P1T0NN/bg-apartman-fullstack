// SVELTEKIT IMPORTS
import { resolve } from '$app/paths';

// LIBRARIES
import { onMount } from 'svelte';

// UTILS
import { getLocale } from '@/lib/paraglide/runtime';

// TYPES
import type { ZodType } from 'zod';
import type { PlacesAutocompleteStatus } from './types.js';

const AUTOCOMPLETE_ENDPOINT = resolve('/api/places/autocomplete');
const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;

/**
 * Shared Google Places Autocomplete session: debounces the typed term, aborts
 * stale requests, groups them under one billing session token and parses the
 * localized suggestions. `onPick` receives the session token so the caller can
 * complete the session with its Place Details request. Call during component
 * init; state is returned through getters.
 */
export function usePlacesAutocomplete<Suggestion extends { placeId: string }>(options: {
	schema: ZodType<{ suggestions: Suggestion[] }>;
	kind?: 'location' | 'street';
	onPick: (suggestion: Suggestion, sessionToken: string) => void;
}) {
	const { schema, kind, onPick } = options;

	let suggestions = $state<Suggestion[]>([]);
	let active = $state(-1);
	let status = $state<PlacesAutocompleteStatus>('idle');
	let timer: ReturnType<typeof setTimeout> | undefined;
	let controller: AbortController | undefined;
	let sessionToken = '';

	onMount(() => () => {
		clearTimeout(timer);
		controller?.abort();
	});

	function cancel() {
		clearTimeout(timer);
		controller?.abort();
		status = 'idle';
		suggestions = [];
		active = -1;
	}

	async function load(term: string) {
		const request = new AbortController();
		controller = request;
		sessionToken ||= crypto.randomUUID();
		status = 'loading';
		try {
			const response = await fetch(AUTOCOMPLETE_ENDPOINT, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					input: term,
					kind,
					languageCode: getLocale(),
					sessionToken
				}),
				signal: request.signal
			});
			if (!response.ok) throw new Error(`Autocomplete failed with ${response.status}`);
			const parsed = schema.parse(await response.json());
			if (request.signal.aborted) return;
			suggestions = parsed.suggestions;
			status = suggestions.length ? 'idle' : 'empty';
		} catch {
			if (!request.signal.aborted) status = 'failed';
		}
	}

	function search(term: string) {
		cancel();
		const query = term.trim();
		if (query.length < MIN_QUERY_LENGTH) return;
		timer = setTimeout(() => void load(query), DEBOUNCE_MS);
	}

	function pick(suggestion: Suggestion) {
		cancel();
		onPick(suggestion, sessionToken);
		sessionToken = '';
	}

	function keydown(event: KeyboardEvent, optionId: (index: number) => string) {
		if (event.isComposing) return;
		if (event.key === 'Escape' || event.key === 'Tab') cancel();
		if (event.key === 'Enter') {
			event.preventDefault();
			if (active >= 0 && suggestions[active]) pick(suggestions[active]);
			else cancel();
		}
		if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && suggestions.length) {
			event.preventDefault();
			active =
				active < 0
					? event.key === 'ArrowDown'
						? 0
						: suggestions.length - 1
					: (active + (event.key === 'ArrowDown' ? 1 : -1) + suggestions.length) %
						suggestions.length;
			document.getElementById(optionId(active))?.scrollIntoView({ block: 'nearest' });
		}
	}

	return {
		get suggestions() {
			return suggestions;
		},
		get active() {
			return active;
		},
		get status() {
			return status;
		},
		get loading() {
			return status === 'loading';
		},
		search,
		cancel,
		pick,
		keydown
	};
}
