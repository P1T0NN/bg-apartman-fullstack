// LIBRARIES
import { z } from 'zod';

// CONFIG
import { STORAGE_CONFIG } from '../../storage/config.js';

// DATA
import { ACCOMMODATION_TYPES, AMENITY_KEYS } from '../data/accommodationsData.js';

// SCHEMAS
import {
	accommodationCancellationPolicySchema,
	recordedCancellationPolicySchema
} from './cancellationPolicySchemas.js';
import { supportedPaymentMethodsSchema } from '../../payments/schemas/paymentSchemas.js';
import {
	timeZoneSchema,
	timeZoneCoordinatesSchema
} from '../../timezone/schemas/timezoneSchemas.js';

// UTILS
import { calculateAccommodationPricing } from '../utils/calculateAccommodationPricing.js';

const billingPlanIdSchema = z.enum(['flat_fee', 'booking_fee']);

export const accommodationBillingPlanSchema = z.object({ billingPlanId: billingPlanIdSchema });

export const changeAccommodationBillingPlanSchema = accommodationBillingPlanSchema.extend({
	id: z.string().min(1),
	expectedBillingPlanId: z.enum(['flat_fee', 'booking_fee', 'free'])
});

const adminFeeDeadlineSchema = z.iso.datetime({ local: true });

/** Validate only the fields belonging to the selected admin fee plan. */
export const adminAccommodationsFeeDialogFormSchema = z.discriminatedUnion('plan', [
	z.object({
		id: z.string().min(1),
		plan: z.literal('booking_fee'),
		commission: z.number().min(0).max(100).multipleOf(0.01)
	}),
	z
		.object({
			id: z.string().min(1),
			plan: z.literal('flat_fee'),
			amount: z
				.number()
				.positive()
				.max(Number.MAX_SAFE_INTEGER / 100)
				.multipleOf(0.01),
			months: z.number().int().min(1).max(120),
			status: z.enum(['active', 'pending_payment']),
			deadline: z.union([z.literal(''), adminFeeDeadlineSchema])
		})
		.refine((values) => values.status !== 'active' || Date.parse(values.deadline) > Date.now(), {
			path: ['deadline']
		}),
	z
		.object({
			id: z.string().min(1),
			plan: z.literal('free'),
			forever: z.boolean(),
			deadline: z.string()
		})
		.refine(
			(values) =>
				values.forever ||
				(adminFeeDeadlineSchema.safeParse(values.deadline).success &&
					Date.parse(values.deadline) > Date.now()),
			{ path: ['deadline'] }
		)
]);

export const boundsSchema = z
	.object({
		south: z.number().min(-90).max(90),
		north: z.number().min(-90).max(90),
		west: z.number().min(-180).max(180),
		east: z.number().min(-180).max(180)
	})
	.refine((bounds) => bounds.south <= bounds.north);

export type AccommodationBounds = z.infer<typeof boundsSchema>;

export const accommodationSearchFiltersSchema = z
	.object({
		minPrice: z.number().finite().min(0).max(1000000).multipleOf(0.01).optional(),
		maxPrice: z.number().finite().min(0).max(1000000).multipleOf(0.01).optional(),
		type: z.enum(ACCOMMODATION_TYPES).optional(),
		bedrooms: z.number().int().min(0).max(100).optional(),
		beds: z.number().int().min(0).max(100).optional(),
		bathrooms: z.number().int().min(0).max(100).optional(),
		amenities: z.array(z.enum(AMENITY_KEYS)).max(AMENITY_KEYS.length).optional()
	})
	.refine((filters) => !filters.maxPrice || filters.maxPrice >= (filters.minPrice ?? 0));

export type AccommodationSearchFilters = z.infer<typeof accommodationSearchFiltersSchema>;

export const accommodationBasicInfoSchema = z.object({
	type: z.enum(['apartment', 'studio', 'house', 'villa', 'room', 'other']),
	spaceType: z.enum(['entire', 'private', 'shared']),
	maxGuests: z.coerce.number().int().min(1).max(100),
	bedrooms: z.coerce.number().int().min(0).max(100),
	beds: z.coerce.number().int().min(1).max(100),
	bathrooms: z.coerce.number().int().min(1).max(100)
});

export const accommodationLocationSchema = timeZoneCoordinatesSchema.extend({
	timeZone: timeZoneSchema,
	address: z.object({
		street: z.string().trim().min(3).max(200),
		streetNumber: z.string().trim().min(1).max(20),
		city: z.string().trim().min(2).max(100),
		postalCode: z.string().trim().max(20).optional(),
		country: z.string().trim().min(2).max(100)
	})
});

export const accommodationAmenitiesStepSchema = z.object({
	amenities: z.array(z.enum(AMENITY_KEYS)).max(AMENITY_KEYS.length)
});

export const accommodationPhotosSchema = z.object({
	name: z.string().trim().min(5).max(100),
	description: z.string().trim().min(30).max(5000),
	imageKeys: z.array(z.string()).min(5).max(STORAGE_CONFIG.maxFilesPerUpload)
});

export const accommodationPricingSchema = z
	.object({
		weekendPrice: z.preprocess(
			(value) => (value === '' || value === undefined ? null : value),
			z.coerce.number().positive().max(100000).multipleOf(0.01).nullable()
		),
		discountPercent: z.coerce.number().min(0).max(99.99).multipleOf(0.01),
		supportedPaymentMethods: supportedPaymentMethodsSchema,
		nightlyPrice: z.coerce.number().positive().max(100000).multipleOf(0.01),
		minimumStay: z.coerce.number().int().min(1).max(365),
		maximumStay: z.preprocess(
			(value) => (value === '' ? undefined : value),
			z.coerce.number().int().min(1).max(365).optional()
		)
	})
	.refine(
		(values) =>
			calculateAccommodationPricing(
				values.nightlyPrice,
				values.discountPercent,
				values.weekendPrice
			).effectivePricePerNightMinor > 0,
		{ path: ['discountPercent'], params: { code: 'DISCOUNT_PRICE_TOO_LOW' } }
	)
	.refine((values) => values.weekendPrice === null || values.weekendPrice >= values.nightlyPrice, {
		path: ['weekendPrice'],
		params: { code: 'WEEKEND_PRICE_TOO_LOW' }
	})
	.refine(
		(values) =>
			values.weekendPrice === null ||
			calculateAccommodationPricing(values.weekendPrice, values.discountPercent)
				.effectivePricePerNightMinor > 0,
		{ path: ['weekendPrice'], params: { code: 'DISCOUNT_PRICE_TOO_LOW' } }
	);

const TIME_SLOT_PATTERN = /^([01]\d|2[0-3]):(00|30)$/;

export const accommodationRulesSchema = z.object({
	bookingMode: z.enum(['request', 'instant']).default('request'),
	sameDayReservation: z.boolean().default(false),
	timeZone: timeZoneSchema,
	checkInStart: z.string().regex(TIME_SLOT_PATTERN),
	checkInEnd: z.string().regex(TIME_SLOT_PATTERN),
	checkOut: z.string().regex(TIME_SLOT_PATTERN),
	smokingAllowed: z.boolean(),
	petsAllowed: z.boolean(),
	partiesAllowed: z.boolean(),
	houseRules: z.string().trim().max(2000)
});

export const accommodationSectionSchemas = [
	accommodationBasicInfoSchema,
	accommodationLocationSchema,
	accommodationAmenitiesStepSchema,
	accommodationPhotosSchema,
	accommodationPricingSchema.and(accommodationBillingPlanSchema),
	accommodationRulesSchema,
	accommodationCancellationPolicySchema
];

const accommodationDetailsSchema = accommodationBasicInfoSchema
	.and(accommodationLocationSchema)
	.and(accommodationAmenitiesStepSchema)
	.and(accommodationPhotosSchema)
	.and(accommodationPricingSchema)
	.and(accommodationRulesSchema);

export const saveAccommodationSchema = accommodationDetailsSchema.and(
	accommodationCancellationPolicySchema
);

// Ordinary section edits preserve an existing policy until a host explicitly replaces it.
export const storedAccommodationSchema = accommodationDetailsSchema.and(
	z.object({
		cancellationPolicy: recordedCancellationPolicySchema
	})
);

export type AccommodationDetails = z.infer<typeof saveAccommodationSchema>;

/** Creation requires a plan; ordinary listing edits cannot change billing. */
export const createAccommodationSchema = saveAccommodationSchema.and(
	accommodationBillingPlanSchema
);
