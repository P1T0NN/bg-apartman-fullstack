// LIBRARIES
import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const favorites = defineTable({
	/** Identity subject of the user who saved the accommodation. */
	ownerId: v.string(),
	accommodationId: v.id('accommodations')
})
	.index('by_owner_id', ['ownerId'])
	.index('by_owner_id_accommodation_id', ['ownerId', 'accommodationId']);
