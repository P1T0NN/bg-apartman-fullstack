// LIBRARIES
import { ConvexError, v } from 'convex/values';

// BUILDERS
import { authenticatedMutation } from '../../../builders/convexFunctionBuilders.js';

// AUTH
import { getOwnerId } from '../../../betterAuth/helpers/requireIdentity.js';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';

/**
 * Owner-scoped publish toggle: publishes or unpublishes a listing without
 * touching its stored details, so it can be published again later.
 */
export const updateAccommodationPublishStatus = authenticatedMutation({
	rateLimit: { name: 'accommodations:update-publish-status' },
	args: {
		id: v.id('accommodations'),
		status: v.union(v.literal('published'), v.literal('unpublished'))
	},
	returns: v.null(),
	handler: async (ctx, { id, status }) => {
		const existing = await ctx.db.get('accommodations', id);
		if (!existing || existing.ownerId !== getOwnerId(ctx.identity)) {
			throw new ConvexError<BackendErrorData>({ code: 'FORBIDDEN' });
		}
		if (existing.status === 'deleted')
			throw new ConvexError<BackendErrorData>({ code: 'ACCOMMODATION_NOT_FOUND' });

		if (existing.status === status) return null;

		await ctx.db.patch('accommodations', id, { status, updatedAt: Date.now() });

		return null;
	}
});
