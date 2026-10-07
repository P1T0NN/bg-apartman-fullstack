// MIGRATIONS
import { migrations } from './migrations.js';

// CONFIG
import { ACCOMMODATION_BILLING_PLANS } from '../../shared/features/accommodations/config.js';

/** Assign seeded legacy listings the booking-fee plan without changing visibility. */
export const backfillAccommodationBilling = migrations.define({
	table: 'accommodations',
	migrateOne: async (ctx, accommodation) => {
		const hasBilling =
			accommodation.billingPlanId !== undefined &&
			accommodation.billingTerms !== undefined &&
			accommodation.billingStatus !== undefined;
		if (hasBilling) {
			const billingPlanId = accommodation.billingTerms.model;
			if (accommodation.billingPlanId !== billingPlanId)
				await ctx.db.patch('accommodations', accommodation._id, { billingPlanId });
			return;
		}

		const hasPartialBilling =
			accommodation.billingPlanId !== undefined ||
			accommodation.billingTerms !== undefined ||
			accommodation.billingStatus !== undefined;
		if (hasPartialBilling) throw new Error(`Incomplete billing fields on ${accommodation._id}`);

		await ctx.db.patch('accommodations', accommodation._id, {
			billingPlanId: 'booking_fee',
			billingTerms: ACCOMMODATION_BILLING_PLANS.booking_fee,
			billingStatus: 'active'
		});
	}
});
