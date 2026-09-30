// CONVEX
import { authenticatedQuery } from '../../../builders/convexFunctionBuilders.js';

// HELPERS
import { enrichBookingPage } from '../helpers/enrichBookingPage.js';
import { getHostBookingPage } from '../helpers/getHostBookingPage.js';
import { readBookingFilters } from '../helpers/readBookingFilters.js';

// AUTH
import { getOwnerId } from '../../../betterAuth/helpers/requireIdentity.js';

// VALIDATORS
import { listPageArgs } from '../../../validators/listPageArgs.js';
import { hostBookingPage } from '../validators/bookingValidators.js';

/** One indexed page scoped to the signed-in host's accommodations, with guest search and status filter. */
export const fetchHostBookings = authenticatedQuery({
	args: listPageArgs,
	returns: hostBookingPage,
	handler: async (ctx, args) => {
		const search = args.search?.trim() || undefined;
		const filters = readBookingFilters(args.filters);
		const hostId = getOwnerId(ctx.identity);
		const page = await getHostBookingPage({
			ctx,
			hostId,
			paginationOpts: args.paginationOpts,
			search,
			filters
		});

		const items = await enrichBookingPage(ctx, page.items, { onlyPublished: false });
		return { ...page, items };
	}
});
