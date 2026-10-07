// LIBRARIES
import { ConvexError, v } from 'convex/values';

// CONVEX
import { authenticatedMutation } from '../../../builders/convexFunctionBuilders.js';
import { getOwnerId } from '../../../betterAuth/helpers/requireIdentity.js';

// UTILS
import { isAccommodationVisible } from '../../../../shared/features/accommodations/utils/isAccommodationVisible.js';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';

export const updateFavoriteStatus = authenticatedMutation({
	rateLimit: { name: 'favorites:update' },
	args: { accommodationId: v.id('accommodations'), favorite: v.boolean() },
	returns: v.boolean(),
	handler: async (ctx, { accommodationId, favorite }) => {
		const accommodation = await ctx.db.get('accommodations', accommodationId);
		if (!isAccommodationVisible(accommodation)) {
			throw new ConvexError<BackendErrorData>({ code: 'ACCOMMODATION_NOT_FOUND' });
		}

		const ownerId = getOwnerId(ctx.identity);
		const existing = await ctx.db
			.query('favorites')
			.withIndex('by_owner_id_accommodation_id', (q) =>
				q.eq('ownerId', ownerId).eq('accommodationId', accommodationId)
			)
			.first();

		if (favorite && !existing) {
			await ctx.db.insert('favorites', { ownerId, accommodationId });
		} else if (!favorite && existing) {
			await ctx.db.delete('favorites', existing._id);
		}

		return favorite;
	}
});
