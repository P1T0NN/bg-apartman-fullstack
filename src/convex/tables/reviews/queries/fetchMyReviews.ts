// LIBRARIES
import { v } from 'convex/values';

// BUILDERS
import { authenticatedQuery } from '../../../builders/convexFunctionBuilders.js';

// AUTH
import { getOwnerId } from '../../../betterAuth/helpers/requireIdentity.js';

// HELPERS
import { getReviewPage } from '../helpers/getReviewPage.js';
import { enrichMyReview } from '../helpers/enrichMyReview.js';

// VALIDATORS
import { listPageArgs } from '../../../validators/listPageArgs.js';
import { myReview, reviewPage } from '../validators/reviewValidators.js';

export const fetchMyReviews = authenticatedQuery({
	args: { paginationOpts: listPageArgs.paginationOpts },
	returns: reviewPage.extend({ items: v.array(myReview) }),
	handler: async (ctx, args) => {
		const ownerId = getOwnerId(ctx.identity);
		const page = await getReviewPage(
			ctx.db
				.query('reviews')
				.withIndex('by_owner_id', (q) => q.eq('ownerId', ownerId))
				.order('desc'),
			args.paginationOpts
		);
		const items = await Promise.all(page.items.map((review) => enrichMyReview(ctx, review)));
		return { ...page, items };
	}
});
