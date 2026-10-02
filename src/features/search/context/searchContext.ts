// LIBRARIES
import { createContext } from 'svelte';

// TYPES
import type { useSortAccommodations } from '@/features/accommodations/hooks/useSortAccommodations.svelte.js';

export const [getSearchContext, setSearchContext] =
	createContext<ReturnType<typeof useSortAccommodations>>();
