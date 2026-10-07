// CONVEX
import { authenticatedQuery } from '../../../builders/convexFunctionBuilders.js';

// AGGREGATES
import { accommodationOwnerAggregate } from '../aggregates/accommodationOwnerAggregate.js';

// AGGREGATE HELPERS
import { getFilteredTotalAggregate } from '../../../aggregates/helpers/getFilteredTotalAggregate.js';
import { getTotalSizeAggregate } from '../../../aggregates/helpers/getTotalSizeAggregate.js';

// AUTH
import { getOwnerId } from '../../../betterAuth/helpers/requireIdentity.js';

// HELPERS
import { resolveImageUrls } from '../utils/resolveImageUrls.js';
import { getMyAccommodationPage } from '../helpers/getMyAccommodationPage.js';
import { readAccommodationFilters } from '../helpers/readAccommodationFilters.js';

// VALIDATORS
import { listPageArgs } from '../../../validators/listPageArgs.js';
import { accommodationOwnerPage } from '../validators/accommodationValidators.js';

export const fetchMyAccommodations = authenticatedQuery({
	args: listPageArgs,
	returns: accommodationOwnerPage,
	handler: async (ctx, args) => {
		const search = args.search?.trim() || undefined;
		const filters = readAccommodationFilters(args.filters);
		const ownerId = getOwnerId(ctx.identity);
		const canCountTotal = !search;
		const page = await getMyAccommodationPage({
			ctx,
			ownerId,
			paginationOpts: args.paginationOpts,
			search,
			filters
		});
		// The owner list card only renders the cover, so resolve a single url per row.
		const rows = await resolveImageUrls(page.items, 1);
		const items = rows.map((row, index) => ({
			...row,
			status: page.items[index].status,
			billingPlanId: page.items[index].billingPlanId,
			billingTerms: page.items[index].billingTerms,
			billingStatus: page.items[index].billingStatus,
			billingPeriodEndsAt: page.items[index].billingPeriodEndsAt
		}));
		const total = canCountTotal
			? filters.type
				? await getFilteredTotalAggregate(ctx, accommodationOwnerAggregate, [
						{ namespace: ownerId, bounds: { prefix: [filters.type] } }
					])
				: await getTotalSizeAggregate(ctx, accommodationOwnerAggregate, { namespace: ownerId })
			: undefined;

		return { ...page, items, total };
	}
});
