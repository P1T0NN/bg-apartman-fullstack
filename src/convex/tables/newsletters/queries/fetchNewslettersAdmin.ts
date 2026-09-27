// WRAPPERS
import { fetchOptimizedQuery } from '../../../wrappers/fetchOptimizedQuery.js';

// AGGREGATES
import { newsletterAggregate } from '../aggregates/newsletterAggregate.js';

// HELPERS
import { getNewsletterPage } from '../helpers/getNewsletterPage.js';

// VALIDATORS
import { newsletterPage } from '../validators/newsletterValidators.js';

export const fetchNewslettersAdmin = fetchOptimizedQuery({
	auth: 'admin',
	returns: newsletterPage,
	count: newsletterAggregate,
	fetchPage: ({ ctx, paginationOpts, search }) => getNewsletterPage(ctx, paginationOpts, search)
});
