// HELPERS
import { getPagination } from '../../../helpers/getPagination.js';

// TYPES
import type { PaginationOptions } from 'convex/server';
import type { ConvexPaginatedSource } from '../../../../shared/features/pagination/types/paginationTypesConvex.js';

/** Keep public and moderation requests bounded even when callers override page sizes. */
export function getReviewPage<T>(
	source: ConvexPaginatedSource<T>,
	paginationOpts: PaginationOptions
) {
	return getPagination(source, {
		paginationOpts: {
			...paginationOpts,
			numItems: Math.min(paginationOpts.numItems, 20),
			maximumRowsRead: Math.min(paginationOpts.maximumRowsRead ?? 40, 40),
			maximumBytesRead: Math.min(paginationOpts.maximumBytesRead ?? 131072, 131072)
		}
	});
}
