// LIBRARIES
import { literals } from 'convex-helpers/validators';
import { defineTable } from 'convex/server';
import { v } from 'convex/values';

// CONFIG
import { ACCOMMODATION_TYPES } from '../../../shared/features/accommodations/types/accommodationTypes.js';

export const accommodations = defineTable({
	// Set server-side from the authenticated user when creating a listing.
	ownerId: v.string(),
	name: v.string(),
	description: v.string(),
	type: literals(...ACCOMMODATION_TYPES),
	spaceType: literals('entire', 'private', 'shared'),
	address: v.object({
		street: v.string(),
		streetNumber: v.string(),
		city: v.string(),
		postalCode: v.optional(v.string()),
		country: v.string()
	}),
	latitude: v.number(),
	longitude: v.number(),
	maxGuests: v.number(),
	bedrooms: v.number(),
	beds: v.number(),
	bathrooms: v.number(),
	// Integer minor units in the platform currency, e.g. 7500 = 75.00.
	pricePerNightMinor: v.number(),
	amenities: v.array(v.string()),
	// Ordered R2 keys; the first image is the cover.
	imageKeys: v.array(v.string()),
	checkInStart: v.string(), // Local property time, HH:mm.
	checkInEnd: v.string(), // Local property time, HH:mm.
	checkOut: v.string(), // Local property time, HH:mm.
	minimumStay: v.number(),
	maximumStay: v.optional(v.number()),
	smokingAllowed: v.boolean(),
	petsAllowed: v.boolean(),
	partiesAllowed: v.boolean(),
	houseRules: v.string(),
	status: v.literal('published'),
	updatedAt: v.number() // Unix milliseconds; Convex supplies _creationTime.
})
	.index('by_owner_id', ['ownerId'])
	.index('by_owner_id_type', ['ownerId', 'type'])
	.index('by_address_country_city', ['address.country', 'address.city'])
	.index('by_latitude', ['latitude'])
	.searchIndex('search_name', { searchField: 'name', filterFields: ['ownerId', 'type'] });
