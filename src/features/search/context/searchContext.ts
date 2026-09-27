// LIBRARIES
import { createContext } from 'svelte';

// TYPES
import type { useSearchCriteria } from '@/features/search/hooks/useSearchCriteria.svelte.js';

export const [getSearchContext, setSearchContext] =
	createContext<ReturnType<typeof useSearchCriteria>>();
