// LIBRARIES
import { v } from 'convex/values';

// BUILDERS
import { authenticatedQuery } from '../../../builders/convexFunctionBuilders.js';

// AUTH
import { getOwnerId } from '../../../betterAuth/helpers/requireIdentity.js';

// UTILS
import { returnMyAccommodationBilling } from '../utils/returnMyAccommodationBilling.js';

// SCHEMAS
import { accommodations } from '../schema.js';

export const fetchMyAccommodationSettings = authenticatedQuery({
	args: { id: v.id('accommodations') },
	returns: v.union(
		v.object({
			billing: accommodations.validator.pick(
				'billingPlanId',
				'billingTerms',
				'billingStatus',
				'billingPeriodEndsAt',
				'status'
			)
		}),
		v.null()
	),
	handler: async (ctx, { id }) => {
		const accommodation = await ctx.db.get('accommodations', id);

		const isUnavailable =
			!accommodation ||
			accommodation.ownerId !== getOwnerId(ctx.identity) ||
			accommodation.status === 'deleted';

		if (isUnavailable) return null;
		return { billing: returnMyAccommodationBilling(accommodation) };
	}
});
