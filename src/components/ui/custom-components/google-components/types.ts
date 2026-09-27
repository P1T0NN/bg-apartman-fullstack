// HOOKS
import type { usePlacesAutocomplete } from './usePlacesAutocomplete.svelte.js';

export type PlacesAutocompleteStatus = 'idle' | 'loading' | 'empty' | 'failed';
export type PlacesAutocomplete = ReturnType<typeof usePlacesAutocomplete>;
