// LIBRARIES
import { v } from 'convex/values';

// BUILDERS
import { authenticatedQuery } from '../../../builders/convexFunctionBuilders.js';

// AUTH
import { getOwnerId } from '../../../betterAuth/helpers/requireIdentity.js';

/** Owner-scoped header summary for the my-accommodation workspace. */
export const fetchMyAccommodation = authenticatedQuery({
	args: { id: v.id('accommodations') },
	returns: v.union(
		v.object({
			_id: v.id('accommodations'),
			name: v.string(),
			address: v.object({ city: v.string(), country: v.string() })
		}),
		v.null()
	),
	handler: async (ctx, { id }) => {
		const accommodation = await ctx.db.get('accommodations', id);
		if (!accommodation || accommodation.ownerId !== getOwnerId(ctx.identity)) return null;

		return {
			_id: accommodation._id,
			name: accommodation.name,
			address: {
				city: accommodation.address.city,
				country: accommodation.address.country
			}
		};
	}
});
