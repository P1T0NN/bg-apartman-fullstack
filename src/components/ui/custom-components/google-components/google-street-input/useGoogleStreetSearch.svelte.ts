// SVELTEKIT IMPORTS
import { resolve } from '$app/paths';

// LIBRARIES
import { getLocale } from '@/lib/paraglide/runtime';

// HOOKS
import { usePlacesAutocomplete } from '../usePlacesAutocomplete.svelte.js';

// UTILS
import {
	streetAddressSchema,
	streetSuggestionsResponseSchema
} from './googleStreetInputSchemas.js';

// TYPES
import type { StreetAddress, StreetSuggestion } from './googleStreetInputSchemas.js';

type StreetSearchStatus = 'idle' | 'loading' | 'empty' | 'failed' | 'details';

export function useGoogleStreetSearch(options: {
	getDisabled: () => boolean;
	onStreetChange: (street: string) => void;
	onAddress: (address: StreetAddress) => void;
}) {
	const { getDisabled, onStreetChange, onAddress } = options;

	let detailsStatus = $state<'idle' | 'loading' | 'failed'>('idle');
	let detailsController: AbortController | undefined;

	async function loadAddress(suggestion: StreetSuggestion, sessionToken: string) {
		onStreetChange(suggestion.mainText);

		detailsStatus = 'loading';

		const request = new AbortController();
		detailsController = request;

		const query = `?languageCode=${encodeURIComponent(getLocale())}&sessionToken=${encodeURIComponent(sessionToken)}`;
		try {
			const response = await fetch(
				resolve('/api/places/[placeId]', { placeId: suggestion.placeId }) + query,
				{ signal: request.signal }
			);

			if (!response.ok) throw new Error('Place details failed');
			const address = streetAddressSchema.parse(await response.json());
			if (request.signal.aborted || getDisabled()) return;

			onStreetChange(address.street || suggestion.mainText);
			onAddress(address);
			detailsStatus = 'idle';
		} catch {
			if (!request.signal.aborted) detailsStatus = 'failed';
		}
	}

	const autocomplete = usePlacesAutocomplete<StreetSuggestion>({
		schema: streetSuggestionsResponseSchema,
		kind: 'street',
		onPick: (suggestion, sessionToken) => void loadAddress(suggestion, sessionToken)
	});

	const status = $derived<StreetSearchStatus>(
		detailsStatus === 'loading'
			? 'details'
			: detailsStatus === 'failed'
				? 'failed'
				: autocomplete.status
	);

	function change(value: string) {
		detailsController?.abort();
		detailsStatus = 'idle';
		onStreetChange(value);
		if (getDisabled()) autocomplete.cancel();
		else autocomplete.search(value);
	}

	return {
		get suggestions() {
			return autocomplete.suggestions;
		},
		get active() {
			return autocomplete.active;
		},
		get status() {
			return status;
		},
		get loading() {
			return status === 'loading';
		},
		get busy() {
			return status === 'loading' || status === 'details';
		},
		get dropdownOpen() {
			return autocomplete.loading || autocomplete.suggestions.length > 0;
		},
		change,
		select: autocomplete.pick,
		close: autocomplete.cancel,
		keydown: autocomplete.keydown
	};
}
