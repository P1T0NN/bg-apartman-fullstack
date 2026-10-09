import { expect, test } from 'vitest';
import { calculateLoyaltyQuote } from '../src/shared/features/loyalty/utils/calculateLoyaltyQuote.js';
import { areLoyaltyBenefitsEqual } from '../src/shared/features/loyalty/utils/areLoyaltyBenefitsEqual.js';

const pricing = { pricePerNightMinor: 10000, discountBps: 1000, weekendPricePerNightMinor: null };
const services = { parking: true, breakfast: true, spa: true };

test('stacking applies loyalty to the property-discounted rate, rather than adding percentages', () => {
	const quote = calculateLoyaltyQuote(pricing, '2026-10-01', '2026-10-04', 3, services, 4, 'stack');
	expect(quote.pricing.effectivePricePerNightMinor).toBe(7200);
	expect(quote.stayPricing.totalMinor).toBe(21600);
	expect(quote.benefits).toMatchObject({
		propertySavingsMinor: 3000,
		loyaltySavingsMinor: 5400,
		breakfast: 'all',
		breakfastGuests: 4,
		parking: true,
		spa: true
	});
});

test('the best offer chooses one discount and keeps the actual loyalty services', () => {
	const equalDiscounts = calculateLoyaltyQuote(
		pricing,
		'2026-10-01',
		'2026-10-02',
		1,
		services,
		1,
		'best'
	);
	expect(equalDiscounts.stayPricing.totalMinor).toBe(9000);
	expect(equalDiscounts.benefits).toMatchObject({
		propertySavingsMinor: 0,
		loyaltySavingsMinor: 1000,
		loyaltyDiscountBps: 1000,
		parking: true
	});
	const loyaltyWins = calculateLoyaltyQuote(
		pricing,
		'2026-10-01',
		'2026-10-04',
		3,
		services,
		4,
		'best'
	);
	expect(loyaltyWins.stayPricing.totalMinor).toBe(24000);
	expect(loyaltyWins.benefits).toMatchObject({
		propertySavingsMinor: 0,
		loyaltySavingsMinor: 6000
	});
	const propertyWins = calculateLoyaltyQuote(
		{ ...pricing, discountBps: 3000 },
		'2026-10-01',
		'2026-10-04',
		3,
		services,
		4,
		'best'
	);
	expect(propertyWins.stayPricing.totalMinor).toBe(21000);
	expect(propertyWins.benefits).toMatchObject({
		propertySavingsMinor: 9000,
		loyaltySavingsMinor: 0,
		loyaltyDiscountBps: 0,
		parking: true,
		breakfastGuests: 4,
		spa: true
	});
});

test('rounds each discount per regular and weekend night and reconciles savings to the final total', () => {
	const quote = calculateLoyaltyQuote(
		{ ...pricing, pricePerNightMinor: 10005, weekendPricePerNightMinor: 12000 },
		'2026-10-01',
		'2026-10-04',
		3,
		services,
		4,
		'stack'
	);
	expect(quote.pricing.effectivePricePerNightMinor).toBe(7204);
	expect(quote.stayPricing).toMatchObject({
		regularNights: 1,
		weekendNights: 2,
		weekendPricePerNightMinor: 8640,
		totalMinor: 24484
	});
	expect(
		quote.benefits!.propertySavingsMinor +
			quote.benefits!.loyaltySavingsMinor +
			quote.stayPricing.totalMinor
	).toBe(34005);
	const smallest = calculateLoyaltyQuote(
		{ ...pricing, pricePerNightMinor: 10000, discountBps: 9999 },
		'2026-10-01',
		'2026-10-02',
		3,
		services,
		1,
		'stack'
	);
	expect(smallest.stayPricing.totalMinor).toBe(1);
});

test('breakfast is capped by level and booked guests, and unavailable services are never promised', () => {
	for (const guests of [1, 2, 4]) {
		const quote = calculateLoyaltyQuote(
			pricing,
			'2026-10-01',
			'2026-10-04',
			2,
			services,
			guests,
			'stack'
		);
		expect(quote.benefits).toMatchObject({
			breakfast: 'up_to_two',
			breakfastGuests: Math.min(2, guests),
			spa: false
		});
	}
	const unavailable = calculateLoyaltyQuote(
		pricing,
		'2026-10-01',
		'2026-10-04',
		3,
		{ parking: false, breakfast: false, spa: false },
		4,
		'stack'
	);
	expect(unavailable.benefits).toMatchObject({
		parking: false,
		breakfast: 'none',
		breakfastGuests: 0,
		spa: false
	});
	const first = calculateLoyaltyQuote(pricing, '2026-10-01', '2026-10-04', 1, services, 4, 'stack');
	expect(first.benefits).toMatchObject({ breakfast: 'none', spa: false });
});

test('no level, no property participation, or no confirmed combination mode leaves property pricing intact', () => {
	for (const [level, property, mode] of [
		[0, services, 'stack'],
		[3, null, 'stack'],
		[3, services, null]
	] as const) {
		const quote = calculateLoyaltyQuote(
			pricing,
			'2026-10-01',
			'2026-10-04',
			level,
			property,
			4,
			mode
		);
		expect(quote.benefits).toBeNull();
		expect(quote.stayPricing.totalMinor).toBe(27000);
	}
});

test('stale-offer checks compare every accepted service and price term without relying on key order', () => {
	const benefits = calculateLoyaltyQuote(
		pricing,
		'2026-10-01',
		'2026-10-04',
		2,
		services,
		4,
		'stack'
	).benefits!;
	expect(areLoyaltyBenefitsEqual({ ...benefits }, benefits)).toBe(true);
	expect(areLoyaltyBenefitsEqual({ ...benefits, parking: false }, benefits)).toBe(false);
	expect(areLoyaltyBenefitsEqual({ ...benefits, breakfastGuests: 1 }, benefits)).toBe(false);
	expect(areLoyaltyBenefitsEqual(undefined, benefits)).toBe(false);
	expect(areLoyaltyBenefitsEqual(undefined, null)).toBe(true);
});

test('card quotes use the earned tier and better single discount without requiring stay dates', () => {
	for (const [level, expectedPrice, expectedDiscount] of [
		[0, 9000, 0],
		[1, 9000, 1000],
		[2, 8500, 1500],
		[3, 8000, 2000]
	] as const) {
		const quote = calculateLoyaltyQuote(pricing, '', '', level, services, 1, 'best');
		expect(quote.pricing.effectivePricePerNightMinor).toBe(expectedPrice);
		expect(quote.benefits?.loyaltyDiscountBps ?? 0).toBe(expectedDiscount);
		expect(quote.stayPricing.totalMinor).toBe(0);
	}
	const largerPropertyOffer = calculateLoyaltyQuote(
		{ ...pricing, discountBps: 3000 },
		'',
		'',
		3,
		services,
		1,
		'best'
	);
	expect(largerPropertyOffer.pricing.effectivePricePerNightMinor).toBe(7000);
	expect(largerPropertyOffer.benefits?.loyaltyDiscountBps).toBe(0);
	const notParticipating = calculateLoyaltyQuote(pricing, '', '', 3, null, 1, 'best');
	expect(notParticipating.pricing.effectivePricePerNightMinor).toBe(9000);
	expect(notParticipating.benefits).toBeNull();
});
