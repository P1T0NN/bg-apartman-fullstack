// LIBRARIES
import { ConvexError, v } from 'convex/values';

// BUILDERS
import { authenticatedUploadMutation } from '../../../builders/convexFunctionBuilders.js';

// AGGREGATES
import { accommodationOwnerAggregate } from '../aggregates/accommodationOwnerAggregate.js';

// HELPERS
import { getOwnerId } from '../../../betterAuth/helpers/requireIdentity.js';

// CONFIG
import {
	ACCOMMODATION_CONFIG,
	ACCOMMODATION_BILLING_PLANS
} from '../../../../shared/features/accommodations/config.js';

// SCHEMAS
import { createAccommodationSchema } from '../../../../shared/features/accommodations/schemas/accommodationSchemas.js';

// VALIDATORS
import { createAccommodationValidator } from '../validators/accommodationValidators.js';

// UTILS
import { calculateAccommodationPricing } from '../../../../shared/features/accommodations/utils/calculateAccommodationPricing.js';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';

export const createAccommodation = authenticatedUploadMutation({
	rateLimit: { name: 'accommodations:create' },
	args: createAccommodationValidator.fields,
	returns: v.id('accommodations'),
	handler: async (ctx, args) => {
		const parsed = createAccommodationSchema.safeParse(args);
		if (!parsed.success) throw new ConvexError<BackendErrorData>({ code: 'INVALID_ACCOMMODATION' });

		const { nightlyPrice, discountPercent, weekendPrice, ...data } = parsed.data;
		const pricing = calculateAccommodationPricing(nightlyPrice, discountPercent, weekendPrice);
		const billingTerms = ACCOMMODATION_BILLING_PLANS[data.billingPlanId];
		const requiresPayment = billingTerms.model === 'flat_fee';

		const uploaded = new Set(args.uploadedFiles ?? []);

		const duplicateImages = new Set(data.imageKeys).size !== data.imageKeys.length;
		if (duplicateImages)
			throw new ConvexError<BackendErrorData>({ code: 'DUPLICATE_RETAINED_IMAGE' });

		const invalidImages =
			Boolean(args.retainedFiles?.length) ||
			data.imageKeys.some((key) => !uploaded.has(key)) ||
			uploaded.size !== data.imageKeys.length;

		if (invalidImages) throw new ConvexError<BackendErrorData>({ code: 'INVALID_RETAINED_IMAGE' });

		const id = await ctx.db.insert('accommodations', {
			loyaltyEligible: false,
			...data,
			...pricing,
			recommendationSortKey: -ACCOMMODATION_CONFIG.recommendationBaselineAverage,
			guestRatingAverage: 0,
			guestReviewCount: 0,
			ownerId: getOwnerId(ctx.identity),
			billingTerms,
			billingStatus: requiresPayment ? 'pending_payment' : 'active',
			billingPeriodEndsAt: null,
			status: 'published',
			updatedAt: Date.now()
		});

		const accommodation = await ctx.db.get('accommodations', id);
		if (!accommodation) throw new ConvexError<BackendErrorData>({ code: 'FORBIDDEN' });

		await accommodationOwnerAggregate.insert(ctx, accommodation);

		return id;
	}
});
