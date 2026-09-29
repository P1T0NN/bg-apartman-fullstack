// HELPERS
import { getPagination } from '../../../helpers/getPagination.js';
import { paginateSearch } from '../../../helpers/paginateSearch.js';

// TYPES
import type { Doc } from '../../../_generated/dataModel.js';
import type { QueryCtx } from '../../../_generated/server.js';
import type { ConvexPaginatedPage } from '../../../../shared/features/pagination/types/paginationTypesConvex.js';
import type { PaginationOptions } from 'convex/server';
import type { FeedbackFilters } from './readFeedbackFilters.js';

type Feedback = Doc<'feedbacks'>;

/** Build the filtered feedbacks page used by the admin feedback list. */
export function getFeedbackPage({
	ctx,
	paginationOpts,
	search,
	filters
}: {
	ctx: QueryCtx;
	paginationOpts: PaginationOptions;
	search?: string;
	filters: FeedbackFilters;
}): Promise<ConvexPaginatedPage<Feedback>> {
	const { type, category } = filters;

	if (search) {
		return paginateSearch({
			ctx,
			search,
			paginationOpts,
			buildQuery: ({ ctx, search: term }) =>
				ctx.db.query('feedbacks').withSearchIndex('search_feedback', (q) => {
					if (type && category)
						return q.search('searchText', term).eq('type', type).eq('category', category);
					if (type) return q.search('searchText', term).eq('type', type);
					if (category) return q.search('searchText', term).eq('category', category);
					return q.search('searchText', term);
				})
		});
	}

	const feedbacks =
		type && category
			? ctx.db
					.query('feedbacks')
					.withIndex('by_type_category', (q) => q.eq('type', type).eq('category', category))
			: type
				? ctx.db.query('feedbacks').withIndex('by_type', (q) => q.eq('type', type))
				: category
					? ctx.db.query('feedbacks').withIndex('by_category', (q) => q.eq('category', category))
					: ctx.db.query('feedbacks');

	return getPagination(feedbacks.order('desc'), { paginationOpts });
}
