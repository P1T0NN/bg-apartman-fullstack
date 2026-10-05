// LIBRARIES
import { literals } from 'convex-helpers/validators';
import { defineTable } from 'convex/server';
import { v } from 'convex/values';

// CONFIG
import { ACCOMMODATION_TYPES } from '../../../shared/features/accommodations/data/accommodationsData.js';

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
	/** Negative recommendation score: ascending index order ranks higher scores, then lower prices. */
	recommendationSortKey: v.number(),
	/** Zero until the published review count reaches the public rating threshold. */
	guestRatingAverage: v.number(),
	guestReviewCount: v.number(),
	amenities: v.array(v.string()),
	// Ordered R2 keys; the first image is the cover.
	imageKeys: v.array(v.string()),
	checkInStart: v.string(), // Local property time, HH:mm.
	/** Required IANA timezone for interpreting local check-in times. */
	timeZone: v.string(),
	checkInEnd: v.string(), // Local property time, HH:mm.
	checkOut: v.string(), // Local property time, HH:mm.
	minimumStay: v.number(),
	maximumStay: v.optional(v.number()),
	smokingAllowed: v.boolean(),
	petsAllowed: v.boolean(),
	partiesAllowed: v.boolean(),
	houseRules: v.string(),
	// Historical listings require host approval; new saves write the selected mode.
	bookingMode: v.optional(literals('request', 'instant')),
	// Required arrival-today setting, backfilled on legacy listings.
	sameDayReservation: v.boolean(),
	cancellationPolicy: v.union(
		v.object({ version: v.literal(1), mode: v.literal('full_refund') }),
		v.object({
			version: v.literal(1),
			mode: v.literal('custom'),
			fiveToSevenDays: literals(100, 50, 0),
			threeToFiveDays: literals(100, 50, 0),
			oneToThreeDays: literals(100, 50, 0),
			under24Hours: literals(100, 50, 0)
		})
	),
	status: literals('published', 'unpublished', 'deleted'),
	/** Set with `status: 'deleted'`; the tombstone keeps booking and review receipts resolvable. */
	deletedAt: v.optional(v.number()),
	deletedBy: v.optional(v.string()),
	updatedAt: v.number() // Unix milliseconds; Convex supplies _creationTime.
})
	// Retained for _creationTime ordering; owner list queries sort newest first.
	// eslint-disable-next-line @convex-dev/no-duplicate-indexes
	.index('by_owner_id', ['ownerId'])
	.index('by_owner_id_type', ['ownerId', 'type'])
	// Retain creation-time ordering for destination map searches.
	// eslint-disable-next-line @convex-dev/no-duplicate-indexes
	.index('by_address_country_city', ['address.country', 'address.city'])
	.index('by_latitude', ['latitude'])
	.index('by_price', ['pricePerNightMinor'])
	.index('by_guest_rating_average_guest_review_count', ['guestRatingAverage', 'guestReviewCount'])
	.index('by_address_country_guest_rating_average_guest_review_count', [
		'address.country',
		'guestRatingAverage',
		'guestReviewCount'
	])
	.index('by_address_country_city_guest_rating_average_guest_review_count', [
		'address.country',
		'address.city',
		'guestRatingAverage',
		'guestReviewCount'
	])
	.index('by_address_country_price', ['address.country', 'pricePerNightMinor'])
	.index('by_address_country_city_price', ['address.country', 'address.city', 'pricePerNightMinor'])
	.index('by_recommendation_sort_key_price', ['recommendationSortKey', 'pricePerNightMinor'])
	.index('by_address_country_recommendation_sort_key_price', [
		'address.country',
		'recommendationSortKey',
		'pricePerNightMinor'
	])
	.index('by_address_country_city_recommendation_sort_key_price', [
		'address.country',
		'address.city',
		'recommendationSortKey',
		'pricePerNightMinor'
	])
	.searchIndex('search_name', { searchField: 'name', filterFields: ['ownerId', 'type'] });
