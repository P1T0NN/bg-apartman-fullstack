// CONVEX
import { authenticatedQuery } from '../../../builders/convexFunctionBuilders.js';

// LIBRARIES
import { literals } from 'convex-helpers/validators';
import { v } from 'convex/values';

// HELPERS
import { enrichBookingPage } from '../helpers/enrichBookingPage.js';
import { getHostBookingPage } from '../helpers/getHostBookingPage.js';
import { readBookingFilters } from '../helpers/readBookingFilters.js';

// AUTH
import { getOwnerId } from '../../../betterAuth/helpers/requireIdentity.js';

// VALIDATORS
import { listPageArgs } from '../../../validators/listPageArgs.js';
import { hostBookingPage } from '../validators/bookingValidators.js';

// CONFIG
import { BOOKING_SORTS } from '../../../../shared/features/bookings/data/bookingsData.js';

/** One indexed page scoped to the signed-in host's accommodations, with guest search, status filter and date sort. */
export const fetchHostBookings = authenticatedQuery({
	args: {
		...listPageArgs,
		sort: v.optional(literals(...BOOKING_SORTS))
	},
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
			filters,
			sort: args.sort
		});

		const items = await enrichBookingPage(ctx, page.items, { onlyPublished: false });
		return { ...page, items };
	}
});
