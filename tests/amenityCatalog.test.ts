// LIBRARIES
import { expect, test } from 'vitest';

// DATA
import {
	AMENITIES,
	AMENITY_KEYS,
	POPULAR_AMENITY_KEYS
} from '../src/shared/features/accommodations/data/accommodationsData.js';

// SCHEMAS
import { accommodationAmenitiesStepSchema } from '../src/shared/features/accommodations/schemas/accommodationSchemas.js';

test('the full catalog can be saved while onboarding keeps a small, valid shortcut list', () => {
	expect(new Set(AMENITY_KEYS).size).toBe(AMENITIES.length);
	expect(new Set(POPULAR_AMENITY_KEYS).size).toBe(POPULAR_AMENITY_KEYS.length);
	expect(POPULAR_AMENITY_KEYS.length).toBeLessThanOrEqual(12);
	for (const key of POPULAR_AMENITY_KEYS) expect(AMENITY_KEYS).toContain(key);
	expect(accommodationAmenitiesStepSchema.parse({ amenities: AMENITY_KEYS }).amenities).toEqual(
		AMENITY_KEYS
	);
	expect(accommodationAmenitiesStepSchema.parse({ amenities: [] }).amenities).toEqual([]);
	expect(
		accommodationAmenitiesStepSchema.safeParse({ amenities: ['unknown-amenity'] }).success
	).toBe(false);
});
