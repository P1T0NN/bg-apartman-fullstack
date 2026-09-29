// HELPERS
import { getPagination } from '../../../helpers/getPagination.js';
import { paginateSearch } from '../../../helpers/paginateSearch.js';

// TYPES
import type { Doc } from '../../../_generated/dataModel.js';
import type { QueryCtx } from '../../../_generated/server.js';
import type { ConvexPaginatedPage } from '../../../../shared/features/pagination/types/paginationTypesConvex.js';
import type { PaginationOptions } from 'convex/server';

type NewsletterSubscriber = Doc<'newsletters'>;
export type AdminNewsletterSubscriber = NewsletterSubscriber;

export async function getNewsletterPage({
	ctx,
	paginationOpts,
	search
}: {
	ctx: QueryCtx;
	paginationOpts: PaginationOptions;
	search?: string;
}): Promise<ConvexPaginatedPage<AdminNewsletterSubscriber>> {
	const page = search
		? await paginateSearch<NewsletterSubscriber>({
				ctx,
				search,
				paginationOpts,
				buildQuery: ({ ctx, search }) =>
					ctx.db
						.query('newsletters')
						.withSearchIndex('search_email', (query) => query.search('email', search))
			})
		: await getPagination(ctx.db.query('newsletters').order('desc'), { paginationOpts });

	return page;
}
