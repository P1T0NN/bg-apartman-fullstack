// LIBRARIES
import { ConvexError, v } from 'convex/values';

// CONVEX
import { internal } from '../../../_generated/api.js';

// BUILDERS
import { adminMutation } from '../../../builders/convexFunctionBuilders.js';

// HELPERS
import { invalidateFeePayment } from '../../accommodationFeePayments/helpers/invalidateFeePayment.js';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';

export const grantFreeAccommodationFeeForAdmin = adminMutation({
	rateLimit: { name: 'accommodations:admin-grant-free-fee' },
	args: { id: v.id('accommodations'), billingPeriodEndsAt: v.union(v.number(), v.null()) },
	returns: v.null(),
	handler: async (ctx, { id, billingPeriodEndsAt }) => {
		const now = Date.now();

		const hasInvalidDeadline =
			billingPeriodEndsAt !== null &&
			(!Number.isSafeInteger(billingPeriodEndsAt) ||
				billingPeriodEndsAt <= now ||
				billingPeriodEndsAt > 8640000000000000);

		if (hasInvalidDeadline)
			throw new ConvexError<BackendErrorData>({ code: 'INVALID_ACCOMMODATION' });

		const accommodation = await ctx.db.get('accommodations', id);

		const isAvailableAccommodation = accommodation && accommodation.status !== 'deleted';
		if (!isAvailableAccommodation)
			throw new ConvexError<BackendErrorData>({ code: 'ACCOMMODATION_NOT_FOUND' });

		await invalidateFeePayment(ctx, id);
		await ctx.db.patch('accommodations', id, {
			billingPlanId: 'free',
			billingTerms: { model: 'free' },
			billingStatus: 'active',
			billingPeriodEndsAt,
			updatedAt: now
		});

		if (billingPeriodEndsAt !== null)
			await ctx.scheduler.runAt(
				billingPeriodEndsAt,
				internal.tables.accommodations.mutations.expireFreeAccommodationFee
					.expireFreeAccommodationFee,
				{ id, billingPeriodEndsAt }
			);

		return null;
	}
});
