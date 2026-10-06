// CONVEX
import { paginationOptsValidator } from 'convex/server';
import { query } from '../../../_generated/server.js';
import { getPagination } from '../../../helpers/getPagination.js';

// HELPERS
import { buildAccommodationSearchQuery } from '../helpers/buildAccommodationSearchQuery.js';

// CONFIG
import { ACCOMMODATION_CONFIG } from '../../../../shared/features/accommodations/config.js';

// UTILS
import { setEmptyPagination } from '../../../../shared/features/pagination/utils/setEmptyPagination.js';

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

		if (!accommodationsQuery) return setEmptyPagination(args.paginationOpts.numItems);

		const page = await getPagination(accommodationsQuery, {
			paginationOpts: {
				...args.paginationOpts,
				numItems: Math.min(
					args.paginationOpts.numItems,
					ACCOMMODATION_CONFIG.searchMaximumRowsRead
				),
				maximumRowsRead: Math.min(
					args.paginationOpts.maximumRowsRead ?? ACCOMMODATION_CONFIG.searchMaximumRowsRead,
					ACCOMMODATION_CONFIG.searchMaximumRowsRead
				)
			}
		});

		return {
			...page,
			items: page.items.map(({ _id, name, latitude, longitude, effectivePricePerNightMinor }) => ({
				_id,
				name,
				latitude,
				longitude,
				effectivePricePerNightMinor
			}))
		};
	}
});
