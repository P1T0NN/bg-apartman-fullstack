// LIBRARIES
import { v } from 'convex/values';

// WRAPPERS
import { fetchOptimizedSearchQuery } from '../../wrappers/fetchOptimizedSearchQuery.js';

const searchSuggestion = v.object({
	id: v.string(),
	label: v.string()
});

// Demo-only public suggestions are independent from account-scoped data.
const SEARCH_SUGGESTIONS = [
	{ id: 'tapuskovic', label: 'Tapuskovic' },
	{ id: 'tacos', label: 'Tacos' },
	{ id: 'table', label: 'Table' },
	{ id: 'tablet', label: 'Tablet' },
	{ id: 'tag', label: 'Tag' },
	{ id: 'tail', label: 'Tail' },
	{ id: 'take', label: 'Take' },
	{ id: 'tango', label: 'Tango' }
] as const;

export const fetchSearchSuggestions = fetchOptimizedSearchQuery({
	returns: v.array(searchSuggestion),
	fetchResults: ({ search, limit }) =>
		SEARCH_SUGGESTIONS.filter(({ label }) => label.toLowerCase().startsWith(search)).slice(0, limit)
});
