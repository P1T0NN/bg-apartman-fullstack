// TYPES
import type { Doc, Id } from '@convex/_generated/dataModel';
import type { ReviewSummary } from '../../reviews/types/reviewTypes.js';
import type {
	FieldConfig,
	FormSchema,
	FormValues
} from '../../../../components/ui/custom-components/form/formTypes.js';

export type PublicAccommodation = Omit<
	Doc<'accommodations'>,
	'ownerId' | 'imageKeys' | 'recommendationSortKey' | 'guestRatingAverage' | 'guestReviewCount'
> & {
	imageUrls: string[];
	reviews: ReviewSummary;
};

/** Accommodation row returned by the list queries: only list fields, with resolved image urls. */
export type AccommodationListItem = Omit<
	Doc<'accommodations'>,
	| 'ownerId'
	| 'description'
	| 'spaceType'
	| 'address'
	| 'amenities'
	| 'imageKeys'
	| 'checkInStart'
	| 'checkInEnd'
	| 'checkOut'
	| 'minimumStay'
	| 'maximumStay'
	| 'smokingAllowed'
	| 'petsAllowed'
	| 'partiesAllowed'
	| 'houseRules'
	| 'status'
	| 'updatedAt'
	| 'recommendationSortKey'
	| 'guestRatingAverage'
	| 'guestReviewCount'
> & {
	address: { city: string; country: string };
	imageUrls: string[];
	/** Attached by the search query; owner and favorites list rows omit it. */
	reviews?: ReviewSummary;
};

/** Lightweight location and price data used to cluster every map search result. */
export type AccommodationMapMarker = Pick<
	Doc<'accommodations'>,
	'_id' | 'name' | 'latitude' | 'longitude' | 'pricePerNightMinor'
>;

export const ACCOMMODATION_TYPES = [
	'apartment',
	'studio',
	'house',
	'villa',
	'room',
	'other'
] as const;

export type AccommodationType = (typeof ACCOMMODATION_TYPES)[number];

export const ACCOMMODATION_SORTS = [
	'recommended',
	'price-asc',
	'price-desc',
	'guest-rating'
] as const;
export type AccommodationSort = (typeof ACCOMMODATION_SORTS)[number];

/** Header summary for the owner's my-accommodation workspace. */
export type MyAccommodationSummary = {
	_id: Id<'accommodations'>;
	name: string;
	address: { city: string; country: string };
};

/** Owner's full listing for the my-accommodation listing tab. */
export type MyAccommodationListing = Omit<
	Doc<'accommodations'>,
	'ownerId' | 'recommendationSortKey' | 'guestRatingAverage' | 'guestReviewCount'
> & {
	imageUrls: string[];
};

/** Editable listing section for the my-accommodation workspace. */
export type ListingSection = {
	id: string;
	title: string;
	description: string;
	icon: string;
	group: 'property' | 'booking';
	schema: FormSchema;
	fields: FieldConfig[];
	values: FormValues;
};

/** Aggregate key for per-owner accommodation totals, grouped by type. */
export type AccommodationOwnerAggregateKey = [string, number];
