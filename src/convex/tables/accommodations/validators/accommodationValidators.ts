// LIBRARIES
import { docValidator } from 'convex/server';
import { v } from 'convex/values';
import { literals } from 'convex-helpers/validators';

// SCHEMAS
import { accommodations } from '../schema.js';

// VALIDATORS
import { reviewSummary } from '../../reviews/validators/reviewValidators.js';

// DATA
import {
	ACCOMMODATION_TYPES,
	AMENITY_KEYS
} from '../../../../shared/features/accommodations/data/accommodationsData.js';

export const boundsValidator = v.object({
	south: v.number(),
	north: v.number(),
	west: v.number(),
	east: v.number()
});

export const searchCriteriaArgs = {
	bounds: v.optional(boundsValidator),
	location: v.object({
		city: v.optional(v.string()),
		country: v.optional(v.string())
	}),
	adults: v.optional(v.number()),
	children: v.optional(v.number()),
	rooms: v.optional(v.number()),
	stayFilters: v.optional(
		v.object({
			minPrice: v.optional(v.number()),
			maxPrice: v.optional(v.number()),
			type: v.optional(literals(...ACCOMMODATION_TYPES)),
			bedrooms: v.optional(v.number()),
			beds: v.optional(v.number()),
			bathrooms: v.optional(v.number()),
			amenities: v.optional(v.array(literals(...AMENITY_KEYS)))
		})
	)
};

const accommodationDoc = docValidator('accommodations', accommodations);

// List rows stay small: only fields the search, favorites and owner list UIs render.
const accommodationListItem = accommodationDoc
	.omit(
		'ownerId',
		'description',
		'spaceType',
		'address',
		'amenities',
		'imageKeys',
		'checkInStart',
		'timeZone',
		'checkInEnd',
		'checkOut',
		'minimumStay',
		'maximumStay',
		'smokingAllowed',
		'petsAllowed',
		'partiesAllowed',
		'houseRules',
		'cancellationPolicy',
		'sameDayReservation',
		'supportedPaymentMethods',
		'status',
		'deletedAt',
		'deletedBy',
		'updatedAt',
		'recommendationSortKey',
		'guestRatingAverage',
		'guestReviewCount'
	)
	.extend({
		address: v.object({ city: v.string(), country: v.string() }),
		imageUrls: v.array(v.string())
	});

export const accommodationPage = v.object({
	items: v.array(accommodationListItem),
	nextCursor: v.union(v.string(), v.null()),
	hasNextPage: v.boolean(),
	pageSize: v.number(),
	total: v.optional(v.number())
});

/** Complete editable listing payload; server-owned fields cannot be submitted. */
export const createAccommodationValidator = accommodations.validator
	.omit(
		'ownerId',
		'status',
		'deletedAt',
		'deletedBy',
		'updatedAt',
		'pricePerNightMinor',
		'discountBps',
		'weekendPricePerNightMinor',
		'effectivePricePerNightMinor',
		'recommendationSortKey',
		'guestRatingAverage',
		'guestReviewCount'
	)
	.extend({
		nightlyPrice: v.number(),
		weekendPrice: v.optional(v.union(v.number(), v.null())),
		discountPercent: v.number()
	});

/** Section-agnostic update payload: any subset of the editable listing fields plus the target id. */
export const updateAccommodationValidator = accommodations.validator
	.omit(
		'ownerId',
		'status',
		'deletedAt',
		'deletedBy',
		'updatedAt',
		'pricePerNightMinor',
		'discountBps',
		'weekendPricePerNightMinor',
		'effectivePricePerNightMinor',
		'recommendationSortKey',
		'guestRatingAverage',
		'guestReviewCount'
	)
	.partial()
	.extend({
		id: v.id('accommodations'),
		nightlyPrice: v.optional(v.number()),
		weekendPrice: v.optional(v.union(v.number(), v.null())),
		discountPercent: v.optional(v.number())
	});

export const accommodationSearchPage = accommodationPage.extend({
	items: v.array(accommodationListItem.extend({ reviews: reviewSummary })),
	/** Ids from this page that the signed-in viewer has saved; empty when signed out. */
	favoriteIds: v.array(v.id('accommodations'))
});

export const accommodationMapMarker = accommodationDoc.pick(
	'_id',
	'name',
	'latitude',
	'longitude',
	'effectivePricePerNightMinor'
);

export const accommodationMapPage = v.object({
	items: v.array(accommodationMapMarker),
	nextCursor: v.union(v.string(), v.null()),
	hasNextPage: v.boolean(),
	pageSize: v.number()
});
