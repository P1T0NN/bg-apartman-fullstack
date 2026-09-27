// CONVEX
import { fetchOptimizedQuery } from '../../../wrappers/fetchOptimizedQuery.js';
import { getPagination } from '../../../helpers/getPagination.js';
import { paginateSearch } from '../../../helpers/paginateSearch.js';

// AGGREGATES
import { accommodationOwnerAggregate } from '../aggregates/accommodationOwnerAggregate.js';
import { getFilteredTotalAggregate } from '../../../aggregates/helpers/getFilteredTotalAggregate.js';

// AUTH
import { getOwnerId } from '../../../betterAuth/helpers/requireIdentity.js';

// HELPERS
import { withCoverUrls } from '../helpers/withCoverUrls.js';

// VALIDATORS
import { accommodationPage } from '../validators/accommodationValidators.js';

// CONFIG
import { ACCOMMODATION_TYPES } from '../../../../shared/features/accommodations/types/accommodationTypes.js';

// TYPES
import type { ConvexFilter } from '../../../../shared/features/filters/types/filterTypesConvex.js';
import type { AccommodationType } from '../../../../shared/features/accommodations/types/accommodationTypes.js';

function findTypeFilter(filters: ConvexFilter[]): AccommodationType | undefined {
	const value = filters.find((filter) => filter.field === 'type')?.eq;
	return ACCOMMODATION_TYPES.find((type) => type === value);
}

export const fetchMyAccommodations = fetchOptimizedQuery({
	auth: 'user',
	returns: accommodationPage,
	count: accommodationOwnerAggregate,
	countTotal: ({ ctx, identity }) =>
		accommodationOwnerAggregate.count(ctx, { namespace: getOwnerId(identity) }),
	predicateFor: (key, value) =>
		key === 'type' && ACCOMMODATION_TYPES.some((type) => type === value)
			? { field: 'type', eq: value }
			: undefined,
	filteredTotal: 'exact',
	countFiltered: async ({ ctx, identity, search, filters }) => {
		const type = findTypeFilter(filters);
		if (search || type === undefined) return undefined;
		return getFilteredTotalAggregate(ctx, accommodationOwnerAggregate, [
			{ namespace: getOwnerId(identity), bounds: { prefix: [type] } }
		]);
	},
	fetchPage: async ({ ctx, identity, paginationOpts, search, filters }) => {
		const ownerId = getOwnerId(identity);

		if (search) {
			const page = await paginateSearch({
				ctx,
				search,
				filters,
				paginationOpts,
				buildQuery: ({ search: term, filters: searchFilters }) => {
					const searchType = findTypeFilter(searchFilters);
					return ctx.db
						.query('accommodations')
						.withSearchIndex('search_name', (q) =>
							searchType !== undefined
								? q.search('name', term).eq('ownerId', ownerId).eq('type', searchType)
								: q.search('name', term).eq('ownerId', ownerId)
						);
				}
			});
			return { ...page, items: await withCoverUrls(page.items) };
		}

		const type = findTypeFilter(filters);
		const page =
			type !== undefined
				? await getPagination(
						ctx.db
							.query('accommodations')
							.withIndex('by_owner_id_type', (q) => q.eq('ownerId', ownerId).eq('type', type))
							.order('desc'),
						{ paginationOpts }
					)
				: await getPagination(
						ctx.db
							.query('accommodations')
							.withIndex('by_owner_id', (q) => q.eq('ownerId', ownerId))
							.order('desc'),
						{ paginationOpts }
					);

		return { ...page, items: await withCoverUrls(page.items) };
	}
});
