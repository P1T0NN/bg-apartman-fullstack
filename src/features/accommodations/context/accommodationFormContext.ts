// SVELTEKIT IMPORTS
import { createContext } from 'svelte';

// TYPES
import type { createAccommodationForm } from '@/features/accommodations/hooks/useAccommodationForm.svelte.js';

export const [getAccommodationFormContext, setAccommodationFormContext] =
	createContext<ReturnType<typeof createAccommodationForm>>();
