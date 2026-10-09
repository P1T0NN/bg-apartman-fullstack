// HELPERS
import { getPagination } from '../../../helpers/getPagination.js';
import { paginateSearch } from '../../../helpers/paginateSearch.js';

// TYPES
import type { Doc } from '../../../_generated/dataModel.js';
import type { QueryCtx } from '../../../_generated/server.js';
import type { ConvexPaginatedPage } from '../../../../shared/features/pagination/types/paginationTypesConvex.js';
import type { PaginationOptions } from 'convex/server';
import type { BookingSort } from '../../../../shared/features/bookings/types/bookingTypes.js';
import type { BookingFilters } from './readBookingFilters.js';

type Booking = Doc<'bookings'>;

/** Build the filtered bookings page for the signed-in host's accommodations. */
export async function getHostBookingPage({
	ctx,
	hostId,
	paginationOpts,
	search,
	filters,
	sort
}: {
	ctx: QueryCtx;
	hostId: string;
	paginationOpts: PaginationOptions;
	search?: string;
	filters: BookingFilters;
	sort?: BookingSort;
}): Promise<ConvexPaginatedPage<Booking>> {
	const { status } = filters;

	if (search) {
		return paginateSearch({
			ctx,
			search,
			paginationOpts,
			buildQuery: ({ ctx, search: term }) =>
				ctx.db.query('bookings').withSearchIndex('search_guest', (q) => {
					const visibleBookings = q
						.search('searchText', term)
						.eq('hostId', hostId)
						.eq('hostArchivedAt', undefined);
					return status ? visibleBookings.eq('status', status) : visibleBookings;
				})
		});
	}

	const bookings = status
		? ctx.db
				.query('bookings')
				.withIndex('by_host_id_host_archived_at_status', (q) =>
					q.eq('hostId', hostId).eq('hostArchivedAt', undefined).eq('status', status)
				)
		: ctx.db
				.query('bookings')
				.withIndex('by_host_id_host_archived_at', (q) =>
					q.eq('hostId', hostId).eq('hostArchivedAt', undefined)
				);

	// Pending requests default to the longest wait; every other list defaults to newest.
	const effectiveSort = sort ?? (status === 'pending' ? 'oldest' : 'newest');

	return getPagination(bookings.order(effectiveSort === 'oldest' ? 'asc' : 'desc'), {
		paginationOpts
	});
}
