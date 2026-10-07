// LIBRARIES
import { v } from 'convex/values';

// BUILDERS
import { internalMutation } from '../../../builders/convexFunctionBuilders.js';

/** A stale expiry must never invalidate a newer paid period or a different plan. */
export const expireFlatFeeAccommodation = internalMutation({
	args: { id: v.id('accommodations'), billingPeriodEndsAt: v.number() },
	returns: v.null(),
	handler: async (ctx, { id, billingPeriodEndsAt }) => {
		const accommodation = await ctx.db.get('accommodations', id);
		const shouldExpire =
			accommodation &&
			accommodation.status !== 'deleted' &&
			accommodation.billingPlanId === 'flat_fee' &&
			accommodation.billingStatus === 'active' &&
			accommodation.billingPeriodEndsAt === billingPeriodEndsAt &&
			billingPeriodEndsAt <= Date.now();
		if (!shouldExpire) return null;
		await ctx.db.patch('accommodations', id, {
			billingStatus: 'pending_payment',
			updatedAt: Date.now()
		});
		return null;
	}
});
