// CONVEX
import { authenticatedQuery } from '../../../builders/convexFunctionBuilders.js';

// AGGREGATES
import { bookingOwnerAggregate } from '../aggregates/bookingOwnerAggregate.js';

// AGGREGATE HELPERS
import { getTotalSizeAggregate } from '../../../aggregates/helpers/getTotalSizeAggregate.js';

// HELPERS
import { getPagination } from '../../../helpers/getPagination.js';
import { paginateSearch } from '../../../helpers/paginateSearch.js';
import { enrichBookingPage } from '../helpers/enrichBookingPage.js';

// AUTH
import { getOwnerId } from '../../../betterAuth/helpers/requireIdentity.js';

// VALIDATORS
import { listPageArgs } from '../../../validators/listPageArgs.js';
import { bookingPage } from '../validators/bookingValidators.js';

export const fetchMyBookings = authenticatedQuery({
	args: listPageArgs,
	returns: bookingPage,
	handler: async (ctx, args) => {
		const search = args.search?.trim() || undefined;
		const ownerId = getOwnerId(ctx.identity);
		const canCountTotal = !search;
		const page = search
			? await paginateSearch({
					ctx,
					search,
					paginationOpts: args.paginationOpts,
					buildQuery: ({ ctx, search: term }) =>
						ctx.db
							.query('bookings')
							.withSearchIndex('search_guest', (q) =>
								q.search('searchText', term).eq('ownerId', ownerId)
							)
				})
			: await getPagination(
					ctx.db
						.query('bookings')
						.withIndex('by_owner_id', (q) => q.eq('ownerId', ownerId))
						.order('desc'),
					{ paginationOpts: args.paginationOpts }
				);
		const total = canCountTotal
			? await getTotalSizeAggregate(ctx, bookingOwnerAggregate, { namespace: ownerId })
			: undefined;

		const items = await enrichBookingPage(ctx, page.items);
		return { ...page, items, total };
	}
});
