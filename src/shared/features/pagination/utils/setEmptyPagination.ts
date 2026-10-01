// TYPES
import type { InfinitePage } from '../types/paginationTypes.js';

/** Build the empty cursor page returned when a query has no rows to serve. */
export function setEmptyPagination(pageSize: number): InfinitePage<never> {
	return {
		items: [],
		nextCursor: null,
		hasNextPage: false,
		pageSize
	};
}
