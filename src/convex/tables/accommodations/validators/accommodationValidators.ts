// LIBRARIES
import { docValidator } from 'convex/server';
import { v } from 'convex/values';

// SCHEMAS
import { accommodations } from '../schema.js';

const accommodationDoc = docValidator('accommodations', accommodations);

const accommodationListItem = accommodationDoc.extend({
	coverUrl: v.union(v.string(), v.null()),
	imageUrls: v.array(v.string())
});

export const accommodationPage = v.object({
	items: v.array(accommodationListItem),
	nextCursor: v.union(v.string(), v.null()),
	hasNextPage: v.boolean(),
	pageSize: v.number(),
	total: v.optional(v.number())
});

/** Section-agnostic update payload: any subset of the editable listing fields plus the target id. */
export const updateAccommodationValidator = accommodations.validator
	.omit('ownerId', 'status', 'updatedAt', 'pricePerNightMinor')
	.partial()
	.extend({
		id: v.id('accommodations'),
		nightlyPrice: v.optional(v.number())
	});

export const accommodationSearchPage = accommodationPage.extend({
	/** Ids from this page that the signed-in viewer has saved; empty when signed out. */
	favoriteIds: v.array(v.id('accommodations'))
});
