// CONVEX
import { query } from '../../../_generated/server.js';

// HELPERS
import { resolveImageUrls } from '../utils/resolveImageUrls.js';
import { getAccommodationReviewSummaries } from '../../reviews/helpers/getAccommodationReviewSummaries.js';

// CONFIG
import { ACCOMMODATION_CONFIG } from '../../../../shared/features/accommodations/config.js';

// DATA
import { EMPTY_REVIEW_SUMMARY } from '../../../../shared/features/reviews/data/reviewsData.js';

// UTILS
import { isAccommodationVisible } from '../../../../shared/features/accommodations/utils/isAccommodationVisible.js';

// VALIDATORS
import { featuredAccommodationItems } from '../validators/accommodationValidators.js';

/** Bounded homepage selection: the top loyalty-eligible listings that are publicly visible. */
export const fetchFeaturedAccommodations = query({
	args: {},
	returns: featuredAccommodationItems,
	handler: async (ctx) => {
		const candidates = await ctx.db
			.query('accommodations')
			.withIndex('by_loyalty_eligible_recommendation_sort_key_price', (q) =>
				q.eq('loyaltyEligible', true)
			)
			.take(ACCOMMODATION_CONFIG.featuredCandidateLimit);

		const featured = candidates
			.filter((candidate) => isAccommodationVisible(candidate))
			.slice(0, ACCOMMODATION_CONFIG.featuredLimit);

		const items = await resolveImageUrls(featured);
		const summaries = await getAccommodationReviewSummaries(
			ctx,
			items.map((item) => item._id)
		);

		return items.map((item, index) => ({
			...item,
			reviews: summaries[index] ?? EMPTY_REVIEW_SUMMARY
		}));
	}
});
