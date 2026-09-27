// WRAPPERS
import { fetchOptimizedQuery } from '../../../wrappers/fetchOptimizedQuery.js';

// AGGREGATES
import { feedbackAggregate } from '../aggregates/feedbackAggregate.js';

// HELPERS
import { getPagination } from '../../../helpers/getPagination.js';
import { paginateSearch } from '../../../helpers/paginateSearch.js';

// VALIDATORS
import { feedbackPage } from '../validators/feedbackValidators.js';

// CONFIG
import {
	FEEDBACK_CATEGORIES,
	FEEDBACK_TYPES
} from '../../../../shared/features/feedbacks/schemas/feedbackSchemas.js';

// TYPES
import type { ConvexFilter } from '../../../../shared/features/filters/types/filterTypesConvex.js';
import type {
	FeedbackCategory,
	FeedbackType
} from '../../../../shared/features/feedbacks/schemas/feedbackSchemas.js';

function findTypeFilter(filters: ConvexFilter[]): FeedbackType | undefined {
	const value = filters.find((filter) => filter.field === 'type')?.eq;
	return FEEDBACK_TYPES.find((type) => type === value);
}

function findCategoryFilter(filters: ConvexFilter[]): FeedbackCategory | undefined {
	const value = filters.find((filter) => filter.field === 'category')?.eq;
	return FEEDBACK_CATEGORIES.find((category) => category === value);
}

export const fetchFeedbacksAdmin = fetchOptimizedQuery({
	auth: 'admin',
	returns: feedbackPage,
	count: feedbackAggregate,
	predicateFor: (key, value) =>
		key === 'type' && FEEDBACK_TYPES.some((type) => type === value)
			? { field: 'type', eq: value }
			: key === 'category' && FEEDBACK_CATEGORIES.some((category) => category === value)
				? { field: 'category', eq: value }
				: undefined,
	fetchPage: async ({ ctx, paginationOpts, search, filters }) => {
		const type = findTypeFilter(filters);
		const category = findCategoryFilter(filters);

		if (search) {
			return paginateSearch({
				ctx,
				search,
				filters,
				paginationOpts,
				buildQuery: ({ search: term, filters: searchFilters }) => {
					const searchType = findTypeFilter(searchFilters);
					const searchCategory = findCategoryFilter(searchFilters);
					return ctx.db.query('feedbacks').withSearchIndex('search_feedback', (q) => {
						if (searchType && searchCategory)
							return q
								.search('searchText', term)
								.eq('type', searchType)
								.eq('category', searchCategory);
						if (searchType) return q.search('searchText', term).eq('type', searchType);
						if (searchCategory) return q.search('searchText', term).eq('category', searchCategory);
						return q.search('searchText', term);
					});
				}
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
});
