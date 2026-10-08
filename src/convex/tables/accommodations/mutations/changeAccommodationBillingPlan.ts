// LIBRARIES
import { ConvexError, v } from 'convex/values';

// BUILDERS
import { authenticatedMutation } from '../../../builders/convexFunctionBuilders.js';

// AUTH
import { getOwnerId } from '../../../betterAuth/helpers/requireIdentity.js';

// CONFIG
import { ACCOMMODATION_BILLING_PLANS } from '../../../../shared/features/accommodations/config.js';

// SCHEMAS
import { accommodations } from '../schema.js';
import { changeAccommodationBillingPlanSchema } from '../../../../shared/features/accommodations/schemas/accommodationSchemas.js';

// HELPERS
import { invalidateFeePayment } from '../../accommodationFeePayments/helpers/invalidateFeePayment.js';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';

export const changeAccommodationBillingPlan = authenticatedMutation({
	rateLimit: { name: 'accommodations:change-billing-plan' },
	args: {
		id: v.id('accommodations'),
		billingPlanId: accommodations.validator.fields.billingPlanId,
		expectedBillingPlanId: accommodations.validator.fields.billingPlanId
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const parsed = changeAccommodationBillingPlanSchema.safeParse(args);
		if (!parsed.success) throw new ConvexError<BackendErrorData>({ code: 'INVALID_ACCOMMODATION' });

		const existing = await ctx.db.get('accommodations', args.id);

		const isOwnedAccommodation = existing && existing.ownerId === getOwnerId(ctx.identity);
		if (!isOwnedAccommodation) throw new ConvexError<BackendErrorData>({ code: 'FORBIDDEN' });

		if (existing.status === 'deleted')
			throw new ConvexError<BackendErrorData>({ code: 'ACCOMMODATION_NOT_FOUND' });

		if (existing.billingPlanId !== args.expectedBillingPlanId)
			throw new ConvexError<BackendErrorData>({ code: 'ACCOMMODATION_BILLING_PLAN_CHANGED' });

		if (existing.billingPlanId === args.billingPlanId) return null;

		const now = Date.now();

		const isPaidPeriodLocked =
			(existing.billingPlanId === 'flat_fee' || existing.billingPlanId === 'free') &&
			existing.billingStatus === 'active' &&
			(existing.billingPeriodEndsAt == null || existing.billingPeriodEndsAt > now);

		if (isPaidPeriodLocked)
			throw new ConvexError<BackendErrorData>({ code: 'ACCOMMODATION_BILLING_PLAN_LOCKED' });

		await invalidateFeePayment(ctx, args.id);
		const requiresPayment = args.billingPlanId === 'flat_fee';

		await ctx.db.patch('accommodations', args.id, {
			billingPlanId: args.billingPlanId,
			billingTerms: ACCOMMODATION_BILLING_PLANS[parsed.data.billingPlanId],
			billingStatus: requiresPayment ? 'pending_payment' : 'active',
			billingPeriodEndsAt: null,
			updatedAt: now
		});

		return null;
	}
});
