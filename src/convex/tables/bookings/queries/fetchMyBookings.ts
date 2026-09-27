// CONVEX
import { fetchOptimizedQuery } from '../../../wrappers/fetchOptimizedQuery.js';
import { getPagination } from '../../../helpers/getPagination.js';
import { paginateSearch } from '../../../helpers/paginateSearch.js';

// AGGREGATES
import { bookingOwnerAggregate } from '../aggregates/bookingOwnerAggregate.js';

// AUTH
import { getOwnerId } from '../../../betterAuth/helpers/requireIdentity.js';

// VALIDATORS
import { bookingPage } from '../validators/bookingValidators.js';

export const fetchMyBookings = fetchOptimizedQuery({
	auth: 'user',
	returns: bookingPage,
	count: bookingOwnerAggregate,
	countTotal: ({ ctx, identity }) =>
		bookingOwnerAggregate.count(ctx, { namespace: getOwnerId(identity) }),
	fetchPage: async ({ ctx, identity, paginationOpts, search, filters }) => {
		const ownerId = getOwnerId(identity);

		if (search) {
			return paginateSearch({
				ctx,
				search,
				filters,
				paginationOpts,
				buildQuery: ({ search: term }) =>
					ctx.db
						.query('bookings')
						.withSearchIndex('search_guest', (q) =>
							q.search('searchText', term).eq('ownerId', ownerId)
						)
			});
		}

		return getPagination(
			ctx.db
				.query('bookings')
				.withIndex('by_owner_id', (q) => q.eq('ownerId', ownerId))
				.order('desc'),
			{ paginationOpts }
		);
	}
});
