// MIGRATIONS
import { migrations } from './migrations.js';

/** Fill the paid-period field without changing publication choice. */
export const backfillAccommodationFeeSettings = migrations.define({
	table: 'accommodations',
	migrateOne: async (ctx, accommodation) => {
		if (accommodation.billingPeriodEndsAt !== undefined) return;
		await ctx.db.patch('accommodations', accommodation._id, { billingPeriodEndsAt: null });
	}
});
