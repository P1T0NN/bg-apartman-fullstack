// CONVEX
import { adminQuery } from '../../../builders/convexFunctionBuilders.js';

// AGGREGATES
import { newsletterAggregate } from '../aggregates/newsletterAggregate.js';

// AGGREGATE HELPERS
import { getTotalSizeAggregate } from '../../../aggregates/helpers/getTotalSizeAggregate.js';

// HELPERS
import { getNewsletterPage } from '../helpers/getNewsletterPage.js';

// VALIDATORS
import { listPageArgs } from '../../../validators/listPageArgs.js';
import { newsletterPage } from '../validators/newsletterValidators.js';

export const fetchNewslettersAdmin = adminQuery({
	args: listPageArgs,
	returns: newsletterPage,
	handler: async (ctx, args) => {
		const search = args.search?.trim() || undefined;
		const canCountTotal = !search;
		const page = await getNewsletterPage({
			ctx,
			paginationOpts: args.paginationOpts,
			search
		});
		const total = canCountTotal ? await getTotalSizeAggregate(ctx, newsletterAggregate) : undefined;

		return { ...page, total };
	}
});
