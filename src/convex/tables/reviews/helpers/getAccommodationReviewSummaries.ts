// AGGREGATES
import { reviewAggregate } from '../aggregates/reviewAggregate.js';

// CONFIG
import { REVIEWS_CONFIG } from '../../../../shared/features/reviews/config.js';

// TYPES
import type { QueryCtx } from '../../../_generated/server.js';
import type { Id } from '../../../_generated/dataModel.js';
import type { ReviewSummary } from '../../../../shared/features/reviews/types/reviewTypes.js';

/** Batched summaries for a page of accommodations: one count batch and one sum batch. */
export async function getAccommodationReviewSummaries(
	ctx: QueryCtx,
	accommodationIds: Id<'accommodations'>[]
): Promise<ReviewSummary[]> {
	if (accommodationIds.length === 0) return [];

	const [counts, sums] = await Promise.all([
		reviewAggregate.countBatch(
			ctx,
			accommodationIds.flatMap((namespace) =>
				REVIEWS_CONFIG.REVIEW_RATINGS.map((rating) => ({ namespace, bounds: { eq: rating } }))
			)
		),
		reviewAggregate.sumBatch(
			ctx,
			accommodationIds.map((namespace) => ({ namespace }))
		)
	]);

	return accommodationIds.map((_, index) => {
		const distribution = counts.slice(
			index * REVIEWS_CONFIG.REVIEW_RATINGS.length,
			(index + 1) * REVIEWS_CONFIG.REVIEW_RATINGS.length
		);
		const count = distribution.reduce((total, value) => total + value, 0);
		const sum = sums[index] ?? 0;
		return { count, average: count ? sum / count : null, distribution };
	});
}
