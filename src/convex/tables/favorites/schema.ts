// LIBRARIES
import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const favorites = defineTable({
	/** Identity subject of the user who saved the accommodation. */
	ownerId: v.string(),
	accommodationId: v.id('accommodations')
})
	// Retained for _creationTime ordering; the favorites list sorts newest first.
	// eslint-disable-next-line @convex-dev/no-duplicate-indexes
	.index('by_owner_id', ['ownerId'])
	.index('by_owner_id_accommodation_id', ['ownerId', 'accommodationId'])
	// Used when a removed listing deletes every favorite that referenced it.
	.index('by_accommodation_id', ['accommodationId']);
