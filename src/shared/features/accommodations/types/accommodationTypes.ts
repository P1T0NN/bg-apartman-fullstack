// DATA
import type { ACCOMMODATION_SORTS, ACCOMMODATION_TYPES } from '../data/accommodationsData.js';

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
export type AccommodationCard = Omit<
	Doc<'accommodations'>,
	| 'ownerId'
	| 'description'
	| 'spaceType'
	| 'address'
	| 'amenities'
	| 'imageKeys'
	| 'checkInStart'
	| 'timeZone'
	| 'checkInEnd'
	| 'checkOut'
	| 'minimumStay'
	| 'maximumStay'
	| 'smokingAllowed'
	| 'petsAllowed'
	| 'partiesAllowed'
	| 'houseRules'
	| 'cancellationPolicy'
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

export type AccommodationType = (typeof ACCOMMODATION_TYPES)[number];

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
export type EditAccommodationListingSection = {
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
