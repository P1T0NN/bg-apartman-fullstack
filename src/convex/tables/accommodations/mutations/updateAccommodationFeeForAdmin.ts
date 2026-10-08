// LIBRARIES
import { ConvexError, v } from 'convex/values';

// CONVEX
import { internal } from '../../../_generated/api.js';

// BUILDERS
import { adminMutation } from '../../../builders/convexFunctionBuilders.js';

// SCHEMAS
import { accommodations } from '../schema.js';
import { updateAccommodationFeeForAdminSchema } from '../../../../shared/features/accommodations/schemas/updateAccommodationFeeForAdminSchema.js';

// HELPERS
import { invalidateFeePayment } from '../../accommodationFeePayments/helpers/invalidateFeePayment.js';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';

/** Admins can replace terms and paid periods without host switching locks. */
export const updateAccommodationFeeForAdmin = adminMutation({
	rateLimit: { name: 'accommodations:admin-update-fee' },
	args: {
		id: v.id('accommodations'),
		billingTerms: accommodations.validator.fields.billingTerms,
		billingStatus: accommodations.validator.fields.billingStatus,
		billingPeriodEndsAt: accommodations.validator.fields.billingPeriodEndsAt
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const parsed = updateAccommodationFeeForAdminSchema.safeParse(args);
		if (!parsed.success) throw new ConvexError<BackendErrorData>({ code: 'INVALID_ACCOMMODATION' });
		const { billingTerms, billingStatus, billingPeriodEndsAt } = parsed.data;
		const now = Date.now();
		const hasInvalidPeriod =
			billingTerms.model === 'flat_fee' &&
			billingStatus === 'active' &&
			(billingPeriodEndsAt === null || billingPeriodEndsAt <= now);
		const hasInvalidBookingFee =
			billingTerms.model === 'booking_fee' &&
			(billingStatus !== 'active' || billingPeriodEndsAt !== null);
		const hasInvalidBillingTerms = hasInvalidPeriod || hasInvalidBookingFee;
		if (hasInvalidBillingTerms)
			throw new ConvexError<BackendErrorData>({ code: 'INVALID_ACCOMMODATION' });
		const accommodation = await ctx.db.get('accommodations', args.id);
		const isAvailableAccommodation = accommodation && accommodation.status !== 'deleted';
		if (!isAvailableAccommodation)
			throw new ConvexError<BackendErrorData>({ code: 'ACCOMMODATION_NOT_FOUND' });
		await invalidateFeePayment(ctx, args.id);
		await ctx.db.patch('accommodations', args.id, {
			billingPlanId: billingTerms.model,
			billingTerms,
			billingStatus,
			billingPeriodEndsAt,
			updatedAt: now
		});
		const shouldSchedulePaidPeriodExpiry =
			billingTerms.model === 'flat_fee' &&
			billingStatus === 'active' &&
			billingPeriodEndsAt !== null;
		if (shouldSchedulePaidPeriodExpiry)
			await ctx.scheduler.runAt(
				billingPeriodEndsAt,
				internal.tables.accommodations.mutations.expireFlatFeeAccommodation
					.expireFlatFeeAccommodation,
				{ id: args.id, billingPeriodEndsAt }
			);
		return null;
	}
});
