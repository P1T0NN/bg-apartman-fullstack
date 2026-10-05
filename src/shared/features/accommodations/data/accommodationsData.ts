// CONFIG
import { ACCOMMODATION_CONFIG } from '../config.js';

// TYPES
import type { AccommodationDetails } from '../schemas/accommodationSchemas.js';

export const ACCOMMODATION_TYPES = [
	'apartment',
	'studio',
	'house',
	'villa',
	'room',
	'other'
] as const;

export const ACCOMMODATION_SORTS = [
	'recommended',
	'price-asc',
	'price-desc',
	'guest-rating'
] as const;

export const AMENITIES = [
	{ key: 'wifi', group: 'essentials', icon: 'icon-[lucide--wifi]' },
	{ key: 'kitchen', group: 'essentials', icon: 'icon-[lucide--cooking-pot]' },
	{ key: 'air-conditioning', group: 'essentials', icon: 'icon-[lucide--snowflake]' },
	{ key: 'heating', group: 'essentials', icon: 'icon-[lucide--heater]' },
	{ key: 'towels', group: 'essentials', icon: 'icon-[lucide--bath]' },
	{ key: 'washer', group: 'essentials', icon: 'icon-[lucide--washing-machine]' },
	{ key: 'workspace', group: 'work', icon: 'icon-[lucide--monitor]' },
	{ key: 'tv', group: 'work', icon: 'icon-[lucide--tv]' },
	{ key: 'parking', group: 'outdoors', icon: 'icon-[lucide--car-front]' },
	{ key: 'elevator', group: 'outdoors', icon: 'icon-[lucide--arrow-up-down]' },
	{ key: 'garden', group: 'outdoors', icon: 'icon-[lucide--trees]' },
	{ key: 'pool', group: 'outdoors', icon: 'icon-[lucide--waves]' }
] as const;

export const AMENITY_KEYS = AMENITIES.map((amenity) => amenity.key);

export const POPULAR_AMENITY_KEYS = [
	'wifi',
	'parking',
	'kitchen',
	'air-conditioning',
	'pool',
	'washer',
	'tv',
	'heating'
] as const satisfies readonly (typeof AMENITIES)[number]['key'][];

export const DEFAULT_CANCELLATION_POLICY_DRAFT = {
	fiveToSevenDays: 100,
	threeToFiveDays: 100,
	oneToThreeDays: 100,
	under24Hours: 100,
	...ACCOMMODATION_CONFIG.CANCELLATION_DEFAULT_POLICY
};

export const EMPTY_ACCOMMODATION: Omit<AccommodationDetails, 'latitude' | 'longitude'> = {
	imageKeys: [],
	name: '',
	description: '',
	type: 'apartment',
	spaceType: 'entire',
	address: { street: '', streetNumber: '', city: '', postalCode: '', country: '' },
	maxGuests: 2,
	bedrooms: 1,
	beds: 1,
	bathrooms: 1,
	nightlyPrice: 0,
	amenities: [],
	checkInStart: '14:00',
	timeZone: '',
	checkInEnd: '22:00',
	checkOut: '11:00',
	minimumStay: 1,
	smokingAllowed: false,
	petsAllowed: false,
	partiesAllowed: false,
	houseRules: '',
	bookingMode: 'request',
	sameDayReservation: false,
	cancellationPolicy: DEFAULT_CANCELLATION_POLICY_DRAFT
};
