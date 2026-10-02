// LIBRARIES
import { ConvexError, v } from 'convex/values';
import { authenticatedUploadMutation } from '../../../builders/convexFunctionBuilders.js';
import { accommodationOwnerAggregate } from '../aggregates/accommodationOwnerAggregate.js';

// HELPERS
import { getOwnerId } from '../../../betterAuth/helpers/requireIdentity.js';

// CONFIG
import { ACCOMMODATION_CONFIG } from '../../../../shared/features/accommodations/config.js';

// SCHEMAS
import { saveAccommodationSchema } from '../../../../shared/features/accommodations/schemas/accommodationSchemas.js';
import { accommodations } from '../schema.js';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';

export const createAccommodation = authenticatedUploadMutation({
	rateLimit: { name: 'accommodations:create' },
	args: accommodations.validator
		.omit(
			'ownerId',
			'status',
			'updatedAt',
			'pricePerNightMinor',
			'latitude',
			'longitude',
			'recommendationSortKey',
			'guestRatingAverage',
			'guestReviewCount'
		)
		.extend({ nightlyPrice: v.number(), latitude: v.number(), longitude: v.number() }).fields,
	returns: v.id('accommodations'),
	handler: async (ctx, args) => {
		const parsed = saveAccommodationSchema.safeParse(args);
		if (!parsed.success) throw new ConvexError<BackendErrorData>({ code: 'INVALID_ACCOMMODATION' });

		const { nightlyPrice, ...data } = parsed.data;

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
			...data,
			pricePerNightMinor: Math.round(nightlyPrice * 100),
			recommendationSortKey: -ACCOMMODATION_CONFIG.recommendationBaselineAverage,
			guestRatingAverage: 0,
			guestReviewCount: 0,
			ownerId: getOwnerId(ctx.identity),
			status: 'published',
			updatedAt: Date.now()
		});

		const accommodation = await ctx.db.get('accommodations', id);
		if (!accommodation) throw new ConvexError<BackendErrorData>({ code: 'FORBIDDEN' });

		await accommodationOwnerAggregate.insert(ctx, accommodation);

		return id;
	}
});
