// MIGRATIONS
import { migrations } from './migrations.js';

// CONFIG
import { ACCOMMODATION_CONFIG } from '../../shared/features/accommodations/config.js';

/** Populate missing policies before making the field required; preserve existing terms. */
export const backfillAccommodationCancellationPolicies = migrations.define({
	table: 'accommodations',
	migrateOne: async (ctx, accommodation) => {
		if (accommodation.cancellationPolicy !== undefined) return;
		await ctx.db.patch('accommodations', accommodation._id, {
			cancellationPolicy: ACCOMMODATION_CONFIG.CANCELLATION_DEFAULT_POLICY
		});
	}
});
