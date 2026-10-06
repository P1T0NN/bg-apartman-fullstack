// LIBRARIES
import { ConvexError, v } from 'convex/values';

// BUILDERS
import { authenticatedQuery } from '../../../builders/convexFunctionBuilders.js';

// AUTH
import { getOwnerId } from '../../../betterAuth/helpers/requireIdentity.js';

// HELPERS
import { getAccommodationCalendar } from '../helpers/getAccommodationCalendar.js';

// VALIDATORS
import { calendarResult } from '../validators/accommodationBlockedDatesValidators.js';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';

export const fetchMyAccommodationCalendar = authenticatedQuery({
	args: {
		accommodationId: v.id('accommodations')
	},
	returns: calendarResult.extend({
		pricing: v.object({
			pricePerNightMinor: v.number(),
			discountBps: v.number(),
			weekendPricePerNightMinor: v.union(v.number(), v.null())
		})
	}),
	handler: async (ctx, { accommodationId }) => {
		const accommodation = await ctx.db.get('accommodations', accommodationId);

		if (!accommodation || accommodation.ownerId !== getOwnerId(ctx.identity)) {
			throw new ConvexError<BackendErrorData>({ code: 'FORBIDDEN' });
		}
		if (accommodation.status === 'deleted')
			throw new ConvexError<BackendErrorData>({ code: 'ACCOMMODATION_NOT_FOUND' });

		return {
			...(await getAccommodationCalendar(ctx, accommodation)),
			pricing: {
				pricePerNightMinor: accommodation.pricePerNightMinor,
				discountBps: accommodation.discountBps,
				weekendPricePerNightMinor: accommodation.weekendPricePerNightMinor ?? null
			}
		};
	}
});
