// LIBRARIES
import { ConvexError, v } from 'convex/values';
import { literals } from 'convex-helpers/validators';

// BUILDERS
import { adminMutation } from '../../../builders/convexFunctionBuilders.js';

// AUTH
import { getOwnerId } from '../../../betterAuth/helpers/requireIdentity.js';

// AGGREGATES
import { reviewAggregate } from '../aggregates/reviewAggregate.js';

// HELPERS
import { updateAccommodationReviewSortKeys } from '../../accommodations/helpers/updateAccommodationReviewSortKeys.js';

// SCHEMAS
import { updateReviewVisibilitySchema } from '../../../../shared/features/reviews/schemas/reviewSchemas.js';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';

export const updateReviewVisibility = adminMutation({
	rateLimit: { name: 'reviews:moderate' },
	args: { id: v.id('reviews'), status: literals('published', 'hidden'), reason: v.string() },
	returns: v.null(),
	handler: async (ctx, args) => {
		const parsed = updateReviewVisibilitySchema.safeParse(args);
		if (!parsed.success) throw new ConvexError<BackendErrorData>({ code: 'INVALID_REVIEW' });
		const review = await ctx.db.get('reviews', args.id);
		if (!review) throw new ConvexError<BackendErrorData>({ code: 'REVIEW_NOT_FOUND' });
		if (review.status === args.status) return null;
		if (args.status === 'hidden') await reviewAggregate.deleteIfExists(ctx, review);
		else await reviewAggregate.insert(ctx, review);
		await ctx.db.patch('reviews', review._id, {
			status: args.status,
			moderatedBy: getOwnerId(ctx.identity),
			moderatedAt: Date.now(),
			moderationReason: parsed.data.reason
		});
		await updateAccommodationReviewSortKeys(ctx, review.accommodationId);
		return null;
	}
});
