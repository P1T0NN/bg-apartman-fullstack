// LIBRARIES
import { v } from 'convex/values';

// BUILDERS
import { authenticatedQuery } from '../../../builders/convexFunctionBuilders.js';

// AUTH
import { getOwnerId } from '../../../betterAuth/helpers/requireIdentity.js';

// HELPERS
import { enrichMyReview } from '../helpers/enrichMyReview.js';

// VALIDATORS
import { myReview } from '../validators/reviewValidators.js';

export const fetchMyReview = authenticatedQuery({
	args: { id: v.id('reviews') },
	returns: v.union(myReview, v.null()),
	handler: async (ctx, args) => {
		const review = await ctx.db.get('reviews', args.id);
		if (!review || review.ownerId !== getOwnerId(ctx.identity)) return null;
		return enrichMyReview(ctx, review);
	}
});
