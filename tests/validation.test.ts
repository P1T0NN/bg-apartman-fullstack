// LIBRARIES
import { expect, test } from 'vitest';
import { z } from 'zod';

// CONFIG
import '../src/lib/validation.js';
import { overwriteGetLocale } from '../src/lib/paraglide/runtime.js';

// SCHEMAS
import { searchLocationSchema } from '../src/shared/features/search/schemas/searchSchemas.js';
import {
	accommodationPhotosSchema,
	accommodationPricingSchema,
	accommodationRulesSchema
} from '../src/shared/features/accommodations/schemas/accommodationSchemas.js';

overwriteGetLocale(() => 'en');

test('global messages distinguish empty, invalid, and out-of-range values without changing validity', () => {
	const photos = accommodationPhotosSchema.pick({ imageKeys: true });
	const cases = [
		[z.string().trim().min(1), '  ', 'This value cannot be empty.'],
		[z.enum(['apartment', 'studio']), '', 'This value cannot be empty.'],
		[z.enum(['apartment', 'studio']), undefined, 'This value cannot be empty.'],
		[z.enum(['apartment', 'studio']), 'wrong', 'Select a valid option.'],
		[searchLocationSchema, null, 'This value cannot be empty.'],
		[searchLocationSchema, { placeId: '' }, 'This value cannot be empty.'],
		[z.string().min(5), 'abc', 'Use at least 5 characters.'],
		[z.string().max(2), 'abc', 'Use no more than 2 characters.'],
		[photos, { imageKeys: [] }, 'This value cannot be empty.'],
		[photos, { imageKeys: ['one'] }, 'Minimum number of items: 5.'],
		[z.array(z.string()).max(1), ['one', 'two'], 'Maximum number of items: 1.'],
		[z.number().min(1), 0, 'Enter a value of at least 1.'],
		[z.number().positive(), 0, 'Enter a value greater than 0.'],
		[z.number().max(10), 11, 'Enter a value of at most 10.'],
		[z.number().lt(10), 10, 'Enter a value less than 10.'],
		[z.number().int(), 1.5, 'Enter a whole number.'],
		[z.coerce.number(), 'abc', 'Enter a valid number.'],
		[z.number().multipleOf(0.01), 1.001, 'Enter a value in increments of 0.01.'],
		[z.email(), '', 'This value cannot be empty.'],
		[z.email(), 'abc', 'Please enter a valid email address.'],
		[z.iso.date(), '2026-02-30', 'Enter a valid date.'],
		[z.iso.time(), '25:00:00', 'Enter a valid time.'],
		[z.literal(true), false, 'Select a valid option.'],
		[z.string().regex(/^x$/), 'y', 'Enter a valid value.']
	] as const;
	for (const [schema, input, message] of cases) {
		const result = schema.safeParse(input);
		expect(result.success).toBe(false);
		expect(result.error?.issues[0].message).toBe(message);
	}
	expect(z.string().optional().safeParse(undefined).success).toBe(true);
	expect(z.string().safeParse('').success).toBe(true);
	expect(z.number().min(0).safeParse(0).success).toBe(true);
	expect(z.boolean().safeParse(false).success).toBe(true);
	expect(searchLocationSchema.safeParse({ placeId: 'ChIJ_valid-place' }).success).toBe(true);
});

test('stay bounds are optional and rule times stay on half-hour slots', () => {
	const pricing = accommodationPricingSchema.safeParse({
		supportedPaymentMethods: 'cash',
		discountPercent: 0,
		nightlyPrice: 80,
		minimumStay: 2,
		maximumStay: ''
	});
	expect(pricing.success).toBe(true);
	if (pricing.success) expect(pricing.data.maximumStay).toBeUndefined();

	const rules = {
		timeZone: 'Europe/Belgrade',
		checkInStart: '14:00',
		checkInEnd: '22:00',
		checkOut: '11:00',
		smokingAllowed: false,
		petsAllowed: false,
		partiesAllowed: false,
		houseRules: ''
	};
	expect(accommodationRulesSchema.safeParse(rules).success).toBe(true);
	expect(accommodationRulesSchema.safeParse({ ...rules, checkInStart: '14:15' }).success).toBe(
		false
	);
	expect(accommodationRulesSchema.safeParse({ ...rules, checkOut: '24:00' }).success).toBe(false);
});
