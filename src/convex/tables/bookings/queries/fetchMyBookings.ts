// CONVEX
import { authenticatedQuery } from '../../../builders/convexFunctionBuilders.js';

// LIBRARIES
import { literals } from 'convex-helpers/validators';
import { v } from 'convex/values';

// HELPERS
import { getPagination } from '../../../helpers/getPagination.js';
import { paginateSearch } from '../../../helpers/paginateSearch.js';
import { enrichBookingPage } from '../helpers/enrichBookingPage.js';
import { readBookingFilters } from '../helpers/readBookingFilters.js';

// AUTH
import { getOwnerId } from '../../../betterAuth/helpers/requireIdentity.js';

// VALIDATORS
import { listPageArgs } from '../../../validators/listPageArgs.js';
import { bookingPage } from '../validators/bookingValidators.js';

// CONFIG
import { BOOKING_SORTS } from '../../../../shared/features/bookings/data/bookingsData.js';

/** One indexed page of the signed-in guest's bookings, with guest search, status filter and date sort. */
export const fetchMyBookings = authenticatedQuery({
	args: {
		...listPageArgs,
		sort: v.optional(literals(...BOOKING_SORTS))
	},
	returns: bookingPage,
	handler: async (ctx, args) => {
		const search = args.search?.trim() || undefined;
		const { status } = readBookingFilters(args.filters);
		const ownerId = getOwnerId(ctx.identity);
		const page = search
			? await paginateSearch({
					ctx,
					search,
					paginationOpts: args.paginationOpts,
					buildQuery: ({ ctx, search: term }) =>
						ctx.db.query('bookings').withSearchIndex('search_guest', (q) => {
							if (status) {
								return q.search('searchText', term).eq('ownerId', ownerId).eq('status', status);
							}
							return q.search('searchText', term).eq('ownerId', ownerId);
						})
				})
			: await getPagination(
					(status
						? ctx.db
								.query('bookings')
								.withIndex('by_owner_id_status', (q) =>
									q.eq('ownerId', ownerId).eq('status', status)
								)
						: ctx.db.query('bookings').withIndex('by_owner_id', (q) => q.eq('ownerId', ownerId))
					).order(args.sort === 'oldest' ? 'asc' : 'desc'),
					{ paginationOpts: args.paginationOpts }
				);

		const items = await enrichBookingPage(ctx, page.items);
		return { ...page, items };
	}
});
