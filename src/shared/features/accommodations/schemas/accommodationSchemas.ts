// LIBRARIES
import { z } from 'zod';

// CONFIG
import { STORAGE_CONFIG } from '../../storage/config.js';

// DATA
import { AMENITY_KEYS } from '../data/accommodationsData.js';

export const boundsSchema = z
	.object({
		south: z.number().min(-90).max(90),
		north: z.number().min(-90).max(90),
		west: z.number().min(-180).max(180),
		east: z.number().min(-180).max(180)
	})
	.refine((bounds) => bounds.south <= bounds.north);

export type AccommodationBounds = z.infer<typeof boundsSchema>;

export const accommodationBasicInfoSchema = z.object({
	type: z.enum(['apartment', 'studio', 'house', 'villa', 'room', 'other']),
	spaceType: z.enum(['entire', 'private', 'shared']),
	maxGuests: z.coerce.number().int().min(1).max(100),
	bedrooms: z.coerce.number().int().min(0).max(100),
	beds: z.coerce.number().int().min(1).max(100),
	bathrooms: z.coerce.number().int().min(1).max(100)
});

export const accommodationLocationSchema = z.object({
	latitude: z.number().finite().min(-90).max(90),
	longitude: z.number().finite().min(-180).max(180),
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

export const accommodationPricingSchema = z.object({
	nightlyPrice: z.coerce.number().positive().max(100000).multipleOf(0.01),
	minimumStay: z.coerce.number().int().min(1).max(365),
	maximumStay: z.preprocess(
		(value) => (value === '' ? undefined : value),
		z.coerce.number().int().min(1).max(365).optional()
	)
});

const TIME_SLOT_PATTERN = /^([01]\d|2[0-3]):(00|30)$/;

export const accommodationRulesSchema = z.object({
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
	accommodationPricingSchema,
	accommodationRulesSchema
];

export const saveAccommodationSchema = accommodationBasicInfoSchema
	.and(accommodationLocationSchema)
	.and(accommodationAmenitiesStepSchema)
	.and(accommodationPhotosSchema)
	.and(accommodationPricingSchema)
	.and(accommodationRulesSchema);

export type AccommodationDetails = z.infer<typeof saveAccommodationSchema>;
