// LIBRARIES
import { createContext } from 'svelte';

// TYPES
import type { useFavorites } from '@/features/favorites/hooks/useFavorites.svelte.js';

export const [getFavoritesContext, setFavoritesContext] =
	createContext<ReturnType<typeof useFavorites>>();
