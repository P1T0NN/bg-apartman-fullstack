// HELPERS
import { getAccommodationReviewSummaries } from './getAccommodationReviewSummaries.js';

// DATA
import { EMPTY_REVIEW_SUMMARY } from '../../../../shared/features/reviews/data/reviewsData.js';

// TYPES
import type { QueryCtx } from '../../../_generated/server.js';
import type { Id } from '../../../_generated/dataModel.js';
import type { ReviewSummary } from '../../../../shared/features/reviews/types/reviewTypes.js';

/** One accommodation's published review summary. */
export async function getAccommodationReviewSummary(
	ctx: QueryCtx,
	accommodationId: Id<'accommodations'>
): Promise<ReviewSummary> {
	const [summary] = await getAccommodationReviewSummaries(ctx, [accommodationId]);
	return summary ?? EMPTY_REVIEW_SUMMARY;
}
