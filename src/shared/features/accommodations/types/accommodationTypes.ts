// TYPES
import type { ACCOMMODATION_SORTS, ACCOMMODATION_TYPES } from '../data/accommodationsData.js';
import type { Doc, Id } from '@convex/_generated/dataModel';
import type { ReviewSummary } from '../../reviews/types/reviewTypes.js';
import type {
	FieldConfig,
	FormSchema,
	FormValues
} from '../../../../components/ui/custom-components/form/formTypes.js';

export type PublicAccommodation = Omit<
	Doc<'accommodations'>,
	| 'ownerId'
	| 'imageKeys'
	| 'recommendationSortKey'
	| 'guestRatingAverage'
	| 'guestReviewCount'
	| 'billingPlanId'
	| 'billingTerms'
	| 'billingStatus'
	| 'billingPeriodEndsAt'
> & {
	imageUrls: string[];
	reviews: ReviewSummary;
	availability: {
		blockedDates: string[];
		bookings: { checkInDate: string; checkOutDate: string }[];
	};
};

/** Accommodation row returned by the list queries: only list fields, with resolved image urls. */
export type AccommodationCard = Omit<
	Doc<'accommodations'>,
	| 'ownerId'
	| 'billingPlanId'
	| 'billingTerms'
	| 'billingStatus'
	| 'billingPeriodEndsAt'
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
	| 'supportedPaymentMethods'
	| 'sameDayReservation'
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
	'_id' | 'name' | 'latitude' | 'longitude' | 'effectivePricePerNightMinor'
>;

export type MyAccommodationCard = AccommodationCard &
	Pick<
		Doc<'accommodations'>,
		'status' | 'billingPlanId' | 'billingTerms' | 'billingStatus' | 'billingPeriodEndsAt'
	>;

export type AccommodationType = (typeof ACCOMMODATION_TYPES)[number];

export type AccommodationSort = (typeof ACCOMMODATION_SORTS)[number];

export type AccommodationPublishStatus = 'published' | 'unpublished';

/** Header summary for the owner's my-accommodation workspace. */
export type MyAccommodationSummary = {
	_id: Id<'accommodations'>;
	name: string;
	status: AccommodationPublishStatus;
	billingPlanId: Doc<'accommodations'>['billingPlanId'];
	billingStatus: Doc<'accommodations'>['billingStatus'];
	billingPeriodEndsAt: number | null;
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
