// HELPERS
import { getPagination } from '../../../helpers/getPagination.js';
import { paginateSearch } from '../../../helpers/paginateSearch.js';

// TYPES
import type { Doc } from '../../../_generated/dataModel.js';
import type { QueryCtx } from '../../../_generated/server.js';
import type { ConvexPaginatedPage } from '../../../../shared/features/pagination/types/paginationTypesConvex.js';
import type { PaginationOptions } from 'convex/server';
import type { BookingFilters } from './readBookingFilters.js';

type Booking = Doc<'bookings'>;

/** Build the filtered bookings page for the signed-in host's accommodations. */
export async function getHostBookingPage({
	ctx,
	hostId,
	paginationOpts,
	search,
	filters
}: {
	ctx: QueryCtx;
	hostId: string;
	paginationOpts: PaginationOptions;
	search?: string;
	filters: BookingFilters;
}): Promise<ConvexPaginatedPage<Booking>> {
	const { status } = filters;

	if (search) {
		return paginateSearch({
			ctx,
			search,
			paginationOpts,
			buildQuery: ({ ctx, search: term }) =>
				ctx.db.query('bookings').withSearchIndex('search_guest', (q) => {
					if (status) return q.search('searchText', term).eq('hostId', hostId).eq('status', status);
					return q.search('searchText', term).eq('hostId', hostId);
				})
		});
	}

	const bookings = status
		? ctx.db
				.query('bookings')
				.withIndex('by_host_id_status', (q) => q.eq('hostId', hostId).eq('status', status))
		: ctx.db.query('bookings').withIndex('by_host_id', (q) => q.eq('hostId', hostId));

	return getPagination(bookings.order(status === 'pending' ? 'asc' : 'desc'), { paginationOpts });
}
