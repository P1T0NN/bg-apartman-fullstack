import {
	calculateStayPricing,
	getNightlyPricing
} from '../src/shared/features/bookings/utils/calculateStayPricing.js';
import { expect, test } from 'vitest';
import {
	calculateAccommodationPricing,
	calculateDiscountedPrice
} from '../src/shared/features/accommodations/utils/calculateAccommodationPricing.js';
import { accommodationPricingSchema } from '../src/shared/features/accommodations/schemas/accommodationSchemas.js';

test('discounts round once per night using integer cents and reject free stays', () => {
	expect(calculateAccommodationPricing(80.25, 15)).toEqual({
		pricePerNightMinor: 8025,
		weekendPricePerNightMinor: null,
		discountBps: 1500,
		effectivePricePerNightMinor: 6821
	});
	expect(calculateDiscountedPrice(101, 5000)).toBe(51);
	expect(calculateDiscountedPrice(8025, 0)).toBe(8025);
	expect(calculateAccommodationPricing(100000, 99.99).effectivePricePerNightMinor).toBe(1000);
	const values = {
		nightlyPrice: 0.01,
		discountPercent: 0,
		minimumStay: 1,
		supportedPaymentMethods: 'cash'
	};
	expect(accommodationPricingSchema.safeParse(values).success).toBe(true);
	for (const discountPercent of [-1, 100, 15.001, 99.99])
		expect(accommodationPricingSchema.safeParse({ ...values, discountPercent }).success).toBe(
			false
		);
});

test('weekend rates discount each night in cents and exclude checkout across DST', () => {
	const pricing = { pricePerNightMinor: 8025, discountBps: 1500, weekendPricePerNightMinor: 10025 };
	expect(calculateStayPricing(pricing, '2026-10-08', '2026-10-11')).toEqual({
		regularNights: 1,
		weekendNights: 2,
		weekendBasePricePerNightMinor: 10025,
		weekendPricePerNightMinor: 8521,
		totalMinor: 23863
	});
	for (const [start, end, total] of [
		['2026-10-08', '2026-10-09', 6821],
		['2026-10-09', '2026-10-10', 8521],
		['2026-10-10', '2026-10-11', 8521],
		['2026-10-11', '2026-10-12', 6821]
	] as const)
		expect(calculateStayPricing(pricing, start, end).totalMinor).toBe(total);
	expect(calculateStayPricing(pricing, '2027-03-26', '2027-03-29').totalMinor).toBe(23863);
	expect(calculateStayPricing(pricing, '2026-10-08', '2026-10-22')).toMatchObject({
		regularNights: 10,
		weekendNights: 4
	});
	expect(
		calculateStayPricing(
			{ ...pricing, weekendPricePerNightMinor: null },
			'2026-10-08',
			'2026-10-11'
		)
	).toMatchObject({ regularNights: 3, weekendNights: 0, totalMinor: 20463 });
	expect(getNightlyPricing(pricing, '2026-10-09').effectivePricePerNightMinor).toBe(8521);
	const values = {
		nightlyPrice: 80.25,
		discountPercent: 15,
		minimumStay: 1,
		supportedPaymentMethods: 'cash'
	};
	expect(accommodationPricingSchema.parse({ ...values, weekendPrice: '' }).weekendPrice).toBeNull();
	for (const weekendPrice of [0, -1, 80, 100.001])
		expect(accommodationPricingSchema.safeParse({ ...values, weekendPrice }).success).toBe(false);
	expect(accommodationPricingSchema.safeParse({ ...values, weekendPrice: 100.25 }).success).toBe(
		true
	);
});
