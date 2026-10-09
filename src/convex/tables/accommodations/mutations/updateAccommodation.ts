// LIBRARIES
import { ConvexError, v } from 'convex/values';

// BUILDERS
import { authenticatedUploadMutation } from '../../../builders/convexFunctionBuilders.js';

// AGGREGATES
import { accommodationOwnerAggregate } from '../aggregates/accommodationOwnerAggregate.js';

// AUTH
import { getOwnerId } from '../../../betterAuth/helpers/requireIdentity.js';

// SCHEMAS
import { storedAccommodationSchema } from '../../../../shared/features/accommodations/schemas/accommodationSchemas.js';
import { cancellationPolicySchema } from '../../../../shared/features/accommodations/schemas/cancellationPolicySchemas.js';
import { timeZoneSchema } from '../../../../shared/features/timezone/schemas/timezoneSchemas.js';

// VALIDATORS
import { updateAccommodationValidator } from '../validators/accommodationValidators.js';

// UTILS
import { calculateAccommodationPricing } from '../../../../shared/features/accommodations/utils/calculateAccommodationPricing.js';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';

/**
 * Owner-scoped section update: patches only the provided listing fields,
 * re-validates the merged listing, verifies new photo keys, and refreshes the
 * owner aggregate because the sort key includes the listing type.
 */
export const updateAccommodation = authenticatedUploadMutation({
	rateLimit: { name: 'accommodations:update' },
	args: updateAccommodationValidator.fields,
	returns: v.null(),
	handler: async (ctx, args) => {
		const existing = await ctx.db.get('accommodations', args.id);
		if (!existing || existing.ownerId !== getOwnerId(ctx.identity)) {
			throw new ConvexError<BackendErrorData>({ code: 'FORBIDDEN' });
		}
		if (existing.status === 'deleted')
			throw new ConvexError<BackendErrorData>({ code: 'ACCOMMODATION_NOT_FOUND' });

		const changesPosition = args.latitude !== undefined || args.longitude !== undefined;
		const hasIncompletePosition =
			changesPosition &&
			(args.latitude === undefined || args.longitude === undefined || args.timeZone === undefined);
		if (hasIncompletePosition) {
			throw new ConvexError<BackendErrorData>({ code: 'INVALID_ACCOMMODATION' });
		}
		if (args.timeZone !== undefined && !timeZoneSchema.safeParse(args.timeZone).success) {
			throw new ConvexError<BackendErrorData>({ code: 'INVALID_ACCOMMODATION' });
		}

		if (args.cancellationPolicy !== undefined) {
			const policy = cancellationPolicySchema.safeParse(args.cancellationPolicy);
			if (!policy.success) {
				throw new ConvexError<BackendErrorData>({ code: 'INVALID_CANCELLATION_POLICY' });
			}
		}

		if (args.imageKeys) {
			const hasDuplicateImages = new Set(args.imageKeys).size !== args.imageKeys.length;
			if (hasDuplicateImages) {
				throw new ConvexError<BackendErrorData>({ code: 'DUPLICATE_RETAINED_IMAGE' });
			}

			const uploaded = new Set(args.uploadedFiles ?? []);
			const hasInvalidImages = args.imageKeys.some(
				(key) => !uploaded.has(key) && !existing.imageKeys.includes(key)
			);
			if (hasInvalidImages) {
				throw new ConvexError<BackendErrorData>({ code: 'INVALID_RETAINED_IMAGE' });
			}
		}

		// Unknown keys (id, uploadedFiles, retainedFiles) are stripped by the schema.
		const parsed = storedAccommodationSchema.safeParse({
			...existing,
			...args,
			timeZone: changesPosition ? args.timeZone : existing.timeZone,
			imageKeys: args.imageKeys ?? existing.imageKeys,
			nightlyPrice: args.nightlyPrice ?? existing.pricePerNightMinor / 100,
			discountPercent: args.discountPercent ?? existing.discountBps / 100,
			weekendPrice:
				args.weekendPrice !== undefined
					? args.weekendPrice
					: existing.weekendPricePerNightMinor == null
						? null
						: existing.weekendPricePerNightMinor / 100
		});
		if (!parsed.success) throw new ConvexError<BackendErrorData>({ code: 'INVALID_ACCOMMODATION' });

		const { nightlyPrice, discountPercent, weekendPrice, ...data } = parsed.data;
		const pricing = calculateAccommodationPricing(nightlyPrice, discountPercent, weekendPrice);
		await ctx.db.patch('accommodations', args.id, {
			...data,
			...pricing,
			updatedAt: Date.now()
		});

		const updated = await ctx.db.get('accommodations', args.id);
		if (!updated) throw new ConvexError<BackendErrorData>({ code: 'FORBIDDEN' });

		await accommodationOwnerAggregate.replace(ctx, existing, updated);

		return null;
	}
});
