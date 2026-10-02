// MIGRATIONS
import { migrations } from './migrations.js';

// HELPERS
import { updateAccommodationReviewSortKeys } from '../tables/accommodations/helpers/updateAccommodationReviewSortKeys.js';

/** Backfill both review sort keys; rerun after changing the recommendation prior or rating threshold. */
export const backfillAccommodationRecommendationScores = migrations.define({
	table: 'accommodations',
	migrateOne: async (ctx, accommodation) => {
		await updateAccommodationReviewSortKeys(ctx, accommodation._id);
	}
});
