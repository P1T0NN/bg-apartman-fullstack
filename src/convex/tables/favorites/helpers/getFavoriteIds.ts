// LIBRARIES
import { ConvexError } from 'convex/values';

// CONFIG
import { FAVORITES_CONFIG } from '../../../../shared/features/favorites/config.js';

// TYPES
import type { QueryCtx } from '../../../_generated/server.js';
import type { Id } from '../../../_generated/dataModel.js';

/** One indexed lookup per id, bounded to the caller's page of accommodations. */
export async function getFavoriteIds(
	ctx: QueryCtx,
	ownerId: string,
	accommodationIds: Id<'accommodations'>[]
): Promise<Id<'accommodations'>[]> {
	if (accommodationIds.length > FAVORITES_CONFIG.maxStatusIds) {
		throw new ConvexError('Too many favorite ids requested');
	}

	const uniqueIds = [...new Set(accommodationIds)];
	const favorites = await Promise.all(
		uniqueIds.map((accommodationId) =>
			ctx.db
				.query('favorites')
				.withIndex('by_owner_id_accommodation_id', (q) =>
					q.eq('ownerId', ownerId).eq('accommodationId', accommodationId)
				)
				.first()
		)
	);

	return uniqueIds.filter((_, index) => favorites[index] !== null);
}
