// LIBRARIES
import { v } from 'convex/values';

// BUILDERS
import { internalMutation } from '../../../builders/convexFunctionBuilders.js';

// CONFIG
import { ACCOMMODATION_BILLING_PLANS } from '../../../../shared/features/accommodations/config.js';

export const expireFreeAccommodationFee = internalMutation({
	args: { id: v.id('accommodations'), billingPeriodEndsAt: v.number() },
	returns: v.null(),
	handler: async (ctx, { id, billingPeriodEndsAt }) => {
		const accommodation = await ctx.db.get('accommodations', id);
		const shouldExpire =
			accommodation &&
			accommodation.status !== 'deleted' &&
			accommodation.billingPlanId === 'free' &&
			accommodation.billingPeriodEndsAt === billingPeriodEndsAt &&
			billingPeriodEndsAt <= Date.now();
		if (!shouldExpire) return null;
		await ctx.db.patch('accommodations', id, {
			billingPlanId: 'booking_fee',
			billingTerms: ACCOMMODATION_BILLING_PLANS.booking_fee,
			billingStatus: 'active',
			billingPeriodEndsAt: null,
			updatedAt: Date.now()
		});
		return null;
	}
});
