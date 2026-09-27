// LIBRARIES
import { docValidator } from 'convex/server';
import { v } from 'convex/values';

// BUILDERS
import { authenticatedQuery } from '../../../builders/convexFunctionBuilders.js';

// AUTH
import { getOwnerId } from '../../../betterAuth/helpers/requireIdentity.js';

// SCHEMAS
import { accommodations } from '../schema.js';

// STORAGE
import { resolveStoredFileUrls } from '../../../storage/r2.js';

/** Owner-scoped single listing with resolved photo URLs; other owners receive null. */
export const fetchMyAccommodationListing = authenticatedQuery({
	args: { id: v.id('accommodations') },
	returns: v.union(
		docValidator('accommodations', accommodations)
			.omit('ownerId')
			.extend({ imageUrls: v.array(v.string()) }),
		v.null()
	),
	handler: async (ctx, { id }) => {
		const accommodation = await ctx.db.get(id);
		if (!accommodation || accommodation.ownerId !== getOwnerId(ctx.identity)) return null;

		const { ownerId: _ownerId, ...listing } = accommodation;
		return { ...listing, imageUrls: await resolveStoredFileUrls(accommodation.imageKeys) };
	}
});
