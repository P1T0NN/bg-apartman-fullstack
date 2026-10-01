// LIBRARIES
import { docValidator } from 'convex/server';
import { v } from 'convex/values';

// BUILDERS
import { adminQuery } from '../../../builders/convexFunctionBuilders.js';

// HELPERS
import { getReviewPage } from '../helpers/getReviewPage.js';

// VALIDATORS
import { listPageArgs } from '../../../validators/listPageArgs.js';
import { reviewPage } from '../validators/reviewValidators.js';

// SCHEMAS
import { reviews } from '../schema.js';

export const fetchReviewsAdmin = adminQuery({
	args: listPageArgs,
	returns: reviewPage.extend({
		items: v.array(
			docValidator('reviews', reviews).extend({ accommodationName: v.union(v.string(), v.null()) })
		)
	}),
	handler: async (ctx, args) => {
		const status = args.filters?.status;
		const source =
			status === 'published' || status === 'hidden'
				? ctx.db.query('reviews').withIndex('by_status', (q) => q.eq('status', status))
				: ctx.db.query('reviews');
		const page = await getReviewPage(source.order('desc'), args.paginationOpts);
		const items = await Promise.all(
			page.items.map(async (review) => ({
				...review,
				accommodationName:
					(await ctx.db.get('accommodations', review.accommodationId))?.name ?? null
			}))
		);
		return { ...page, items };
	}
});
