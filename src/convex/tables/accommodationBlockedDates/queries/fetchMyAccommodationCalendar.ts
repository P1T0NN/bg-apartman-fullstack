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
	returns: calendarResult,
	handler: async (ctx, { accommodationId }) => {
		const accommodation = await ctx.db.get('accommodations', accommodationId);

		if (!accommodation || accommodation.ownerId !== getOwnerId(ctx.identity)) {
			throw new ConvexError<BackendErrorData>({ code: 'FORBIDDEN' });
		}
		if (accommodation.status === 'deleted')
			throw new ConvexError<BackendErrorData>({ code: 'ACCOMMODATION_NOT_FOUND' });

		return getAccommodationCalendar(ctx, accommodation);
	}
});
