// LIBRARIES
import { z } from 'zod';

// HOOKS
import { usePlacesAutocomplete } from '../usePlacesAutocomplete.svelte.js';

// TYPES
import type { PlaceSelection } from './types.js';

const autocompleteResponseSchema = z.object({
	suggestions: z.array(z.object({ placeId: z.string(), label: z.string() }))
});

type PlaceSuggestion = z.infer<typeof autocompleteResponseSchema>['suggestions'][number];

/**
 * Google Places search behind the location input: debounces the typed term,
 * loads localized suggestions through the server proxy and returns the
 * selected place ID with its label. State is
 * returned through getters — destructuring would snapshot it. Call during
 * component init.
 */
export function useGooglePlacesSearch(options: {
	onSelect: (selection: PlaceSelection & { label: string }) => void;
}) {
	const { onSelect } = options;

	const autocomplete = usePlacesAutocomplete<PlaceSuggestion>({
		schema: autocompleteResponseSchema,
		onPick: (suggestion) => onSelect({ label: suggestion.label, placeId: suggestion.placeId })
	});

	return {
		get suggestions() {
			return autocomplete.suggestions;
		},
		get open() {
			return autocomplete.suggestions.length > 0;
		},
		search: autocomplete.search,
		select: autocomplete.pick,
		reset: autocomplete.cancel,
		close: autocomplete.cancel
	};
}
