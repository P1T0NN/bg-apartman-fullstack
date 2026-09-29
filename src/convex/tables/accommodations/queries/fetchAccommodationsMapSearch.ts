// CONVEX
import { paginationOptsValidator } from 'convex/server';
import { query } from '../../../_generated/server.js';
import { getPagination } from '../../../helpers/getPagination.js';

// HELPERS
import {
	buildAccommodationSearchQuery,
	SEARCH_MAXIMUM_ROWS_READ
} from '../helpers/buildAccommodationSearchQuery.js';

// VALIDATORS
import { accommodationMapPage, searchCriteriaArgs } from '../validators/accommodationValidators.js';
import { boundsSchema } from '../../../../shared/features/accommodations/schemas/accommodationSchemas.js';

export const fetchAccommodationsMap = query({
	args: {
		paginationOpts: paginationOptsValidator,
		...searchCriteriaArgs
	},
	returns: accommodationMapPage,
	handler: async (ctx, args) => {
		const bounds = args.bounds ? boundsSchema.parse(args.bounds) : undefined;
		const accommodationsQuery = buildAccommodationSearchQuery(ctx, { ...args, bounds });

		if (!accommodationsQuery) {
			return {
				items: [],
				nextCursor: null,
				hasNextPage: false,
				pageSize: args.paginationOpts.numItems
			};
		}

		const page = await getPagination(accommodationsQuery, {
			paginationOpts: {
				...args.paginationOpts,
				numItems: Math.min(args.paginationOpts.numItems, SEARCH_MAXIMUM_ROWS_READ),
				maximumRowsRead: Math.min(
					args.paginationOpts.maximumRowsRead ?? SEARCH_MAXIMUM_ROWS_READ,
					SEARCH_MAXIMUM_ROWS_READ
				)
			}
		});

		return {
			...page,
			items: page.items.map(({ _id, name, latitude, longitude, pricePerNightMinor }) => ({
				_id,
				name,
				latitude,
				longitude,
				pricePerNightMinor
			}))
		};
	}
});
