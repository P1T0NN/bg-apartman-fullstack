// LIBRARIES
import { ConvexError, v } from 'convex/values';
import { adminMutation } from '../../../builders/convexFunctionBuilders.js';

// UTILS
import { canRefundAccommodationFlatFee } from '../../../../shared/features/accommodations/utils/canRefundAccommodationFlatFee.js';

// CONFIG
import { ACCOMMODATION_PAYMENT_SIMULATION } from '../../../../shared/features/accommodations/config.js';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';

/** Development simulation only; real refunds require provider confirmation first. */
export const refundFlatFeeForAccommodation = adminMutation({
	rateLimit: { name: 'accommodations:admin-refund-flat-fee' },
	args: {
		id: v.id('accommodations'),
		expectedBillingPeriodEndsAt: v.number(),
		expectedUpdatedAt: v.number()
	},
	returns: v.null(),
	handler: async (ctx, { id, expectedBillingPeriodEndsAt, expectedUpdatedAt }) => {
		if (!ACCOMMODATION_PAYMENT_SIMULATION)
			throw new ConvexError<BackendErrorData>({
				code: 'ACCOMMODATION_PAYMENT_SIMULATION_DISABLED'
			});

		const accommodation = await ctx.db.get('accommodations', id);
		if (!accommodation || accommodation.status === 'deleted')
			throw new ConvexError<BackendErrorData>({ code: 'ACCOMMODATION_NOT_FOUND' });

		const now = Date.now();

		const canRefund = canRefundAccommodationFlatFee(
			accommodation,
			expectedBillingPeriodEndsAt,
			expectedUpdatedAt,
			now
		);

		if (!canRefund)
			throw new ConvexError<BackendErrorData>({ code: 'ACCOMMODATION_BILLING_PLAN_CHANGED' });

		await ctx.db.patch('accommodations', id, {
			billingStatus: 'pending_payment',
			billingPeriodEndsAt: null,
			updatedAt: now
		});
		return null;
	}
});
