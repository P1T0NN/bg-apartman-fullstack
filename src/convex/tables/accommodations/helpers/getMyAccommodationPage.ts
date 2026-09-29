// HELPERS
import { getPagination } from '../../../helpers/getPagination.js';
import { paginateSearch } from '../../../helpers/paginateSearch.js';

// TYPES
import type { Doc } from '../../../_generated/dataModel.js';
import type { QueryCtx } from '../../../_generated/server.js';
import type { ConvexPaginatedPage } from '../../../../shared/features/pagination/types/paginationTypesConvex.js';
import type { PaginationOptions } from 'convex/server';
import type { AccommodationFilters } from './readAccommodationFilters.js';

type Accommodation = Doc<'accommodations'>;

/** Build the owner-scoped accommodations page used by the my-accommodations list. */
export function getMyAccommodationPage({
	ctx,
	ownerId,
	paginationOpts,
	search,
	filters
}: {
	ctx: QueryCtx;
	ownerId: string;
	paginationOpts: PaginationOptions;
	search?: string;
	filters: AccommodationFilters;
}): Promise<ConvexPaginatedPage<Accommodation>> {
	const { type } = filters;

	if (search) {
		return paginateSearch({
			ctx,
			search,
			paginationOpts,
			buildQuery: ({ ctx, search: term }) =>
				ctx.db
					.query('accommodations')
					.withSearchIndex('search_name', (q) =>
						type !== undefined
							? q.search('name', term).eq('ownerId', ownerId).eq('type', type)
							: q.search('name', term).eq('ownerId', ownerId)
					)
		});
	}

	const accommodations =
		type !== undefined
			? ctx.db
					.query('accommodations')
					.withIndex('by_owner_id_type', (q) => q.eq('ownerId', ownerId).eq('type', type))
					.order('desc')
			: ctx.db
					.query('accommodations')
					.withIndex('by_owner_id', (q) => q.eq('ownerId', ownerId))
					.order('desc');

	return getPagination(accommodations, { paginationOpts });
}
