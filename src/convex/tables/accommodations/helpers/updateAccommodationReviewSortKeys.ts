// AGGREGATES
import { reviewAggregate } from '../../reviews/aggregates/reviewAggregate.js';

// CONFIG
import { ACCOMMODATION_CONFIG } from '../../../../shared/features/accommodations/config.js';
import { REVIEWS_CONFIG } from '../../../../shared/features/reviews/config.js';

// UTILS
import { calculateRecommendationScore } from '../../../sorting/calculateRecommendationScore.js';

// TYPES
import type { MutationCtx } from '../../../_generated/server.js';
import type { Id } from '../../../_generated/dataModel.js';

/** Call after changing the published-review aggregate, in the same transaction. */
export async function updateAccommodationReviewSortKeys(
	ctx: MutationCtx,
	accommodationId: Id<'accommodations'>
): Promise<void> {
	const accommodation = await ctx.db.get('accommodations', accommodationId);

	if (!accommodation || accommodation.status === 'deleted') return;

	const [count, sum] = await Promise.all([
		reviewAggregate.count(ctx, { namespace: accommodationId }),
		reviewAggregate.sum(ctx, { namespace: accommodationId })
	]);

	const recommendationSortKey = -calculateRecommendationScore({
		average: count ? sum / count : null,
		count,
		baselineAverage: ACCOMMODATION_CONFIG.recommendationBaselineAverage,
		baselineWeight: ACCOMMODATION_CONFIG.recommendationBaselineWeight
	});

	const guestRatingAverage = count >= REVIEWS_CONFIG.MIN_RATING_REVIEWS ? sum / count : 0;
	const guestReviewCount = count;
	const sortKeysChanged =
		accommodation.recommendationSortKey !== recommendationSortKey ||
		accommodation.guestRatingAverage !== guestRatingAverage ||
		accommodation.guestReviewCount !== guestReviewCount;
	if (sortKeysChanged) {
		await ctx.db.patch('accommodations', accommodationId, {
			recommendationSortKey,
			guestRatingAverage,
			guestReviewCount
		});
	}
}
