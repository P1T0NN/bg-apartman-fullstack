// CONVEX
import { adminQuery } from '../../../builders/convexFunctionBuilders.js';

// AGGREGATES
import { feedbackAggregate } from '../aggregates/feedbackAggregate.js';

// AGGREGATE HELPERS
import { getTotalSizeAggregate } from '../../../aggregates/helpers/getTotalSizeAggregate.js';

// HELPERS
import { getFeedbackPage } from '../helpers/getFeedbackPage.js';
import { readFeedbackFilters } from '../helpers/readFeedbackFilters.js';

// VALIDATORS
import { listPageArgs } from '../../../validators/listPageArgs.js';
import { feedbackPage } from '../validators/feedbackValidators.js';

export const fetchFeedbacksAdmin = adminQuery({
	args: listPageArgs,
	returns: feedbackPage,
	handler: async (ctx, args) => {
		const search = args.search?.trim() || undefined;
		const filters = readFeedbackFilters(args.filters);
		const hasFilters = Boolean(filters.type || filters.category);
		const canCountTotal = !search && !hasFilters;
		const page = await getFeedbackPage({
			ctx,
			paginationOpts: args.paginationOpts,
			search,
			filters
		});
		const total = canCountTotal ? await getTotalSizeAggregate(ctx, feedbackAggregate) : undefined;

		return { ...page, total };
	}
});
