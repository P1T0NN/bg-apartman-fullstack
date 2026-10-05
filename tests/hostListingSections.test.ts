import { expect, test } from 'vitest';
import {
	accommodationBasicInfoSchema,
	accommodationPhotosSchema,
	accommodationPricingSchema,
	accommodationRulesSchema
} from '../src/shared/features/accommodations/schemas/accommodationSchemas.js';

const reservationRules = {
	checkInStart: '14:00',
	timeZone: 'Europe/Belgrade',
	checkInEnd: '22:00',
	checkOut: '11:00',
	smokingAllowed: false,
	petsAllowed: false,
	partiesAllowed: false,
	houseRules: ''
};

test('host rules retain arrival-today and discard retired single-day settings', () => {
	expect(accommodationRulesSchema.parse(reservationRules)).toMatchObject({
		sameDayReservation: false
	});
	const parsed = accommodationRulesSchema.parse({
		...reservationRules,
		sameDayReservation: true,
		singleDayReservation: true,
		dayUseStart: '10:00',
		dayUseEnd: '18:00',
		dayUsePrice: 45
	});
	expect(parsed.sameDayReservation).toBe(true);
	for (const key of ['singleDayReservation', 'dayUseStart', 'dayUseEnd', 'dayUsePrice'])
		expect(parsed).not.toHaveProperty(key);
});

test('listing sections validate independently and strip unrelated fields', () => {
	const pricing = accommodationPricingSchema.safeParse({
		nightlyPrice: '85.50',
		minimumStay: '2',
		maximumStay: '',
		name: '',
		imageKeys: []
	});
	expect(pricing.success).toBe(true);
	if (pricing.success)
		expect(pricing.data).toEqual({ nightlyPrice: 85.5, minimumStay: 2, maximumStay: undefined });
	expect(accommodationPricingSchema.safeParse({ nightlyPrice: 0, minimumStay: 2 }).success).toBe(
		false
	);
	expect(
		accommodationBasicInfoSchema.safeParse({
			type: 'apartment',
			spaceType: 'entire',
			maxGuests: 4,
			bedrooms: 2,
			beds: 2,
			bathrooms: 1
		}).success
	).toBe(true);
	expect(
		accommodationRulesSchema.safeParse({
			checkInStart: '14:00',
			timeZone: 'Europe/Belgrade',
			checkInEnd: '22:00',
			checkOut: '11:00',
			smokingAllowed: false,
			petsAllowed: false,
			partiesAllowed: false,
			houseRules: ''
		}).success
	).toBe(true);
	const photos = {
		name: 'Belgrade apartment',
		description: 'A comfortable apartment in central Belgrade, with a kitchen and workspace.',
		imageKeys: ['1', '2', '3', '4', '5']
	};
	expect(accommodationPhotosSchema.safeParse(photos).success).toBe(true);
	expect(
		accommodationPhotosSchema.safeParse({ ...photos, imageKeys: photos.imageKeys.slice(1) }).success
	).toBe(false);
});
