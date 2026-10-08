// UTILS
import { calculateDiscountedPrice } from '../../accommodations/utils/calculateAccommodationPricing.js';
import {
	calculateStayPricing,
	type NightlyPricing
} from '../../bookings/utils/calculateStayPricing.js';
// DATA
import { LOYALTY_LEVELS } from '../data/loyaltyData.js';

// TYPES
import type {
	LoyaltyBookingBenefits,
	LoyaltyDiscountMode,
	LoyaltyLevel,
	LoyaltyServices
} from '../types/loyaltyTypes.js';

export function calculateLoyaltyQuote(
	pricing: NightlyPricing,
	checkInDate: string,
	checkOutDate: string,
	level: LoyaltyLevel,
	services: LoyaltyServices | null,
	guests: number,
	discountMode: LoyaltyDiscountMode | null
) {
	const reward = LOYALTY_LEVELS.find((tier) => tier.level === level);
	const eligible = reward !== undefined && services !== null && discountMode !== null;
	const loyaltyBps = reward ? reward.discount * 100 : 0;
	const loyaltyWins = eligible && loyaltyBps > pricing.discountBps;

	const finalPricing: NightlyPricing = eligible
		? {
				...pricing,
				discountBps:
					discountMode === 'best' ? Math.max(pricing.discountBps, loyaltyBps) : pricing.discountBps,
				loyaltyDiscountBps: discountMode === 'stack' ? loyaltyBps : 0
			}
		: pricing;

	const stayPricing = calculateStayPricing(finalPricing, checkInDate, checkOutDate);

	const effectivePricePerNightMinor = calculateDiscountedPrice(
		calculateDiscountedPrice(finalPricing.pricePerNightMinor, finalPricing.discountBps),
		finalPricing.loyaltyDiscountBps ?? 0
	);

	let benefits: LoyaltyBookingBenefits | null = null;

	if (eligible) {
		const original = calculateStayPricing(
			{ ...pricing, discountBps: 0, loyaltyDiscountBps: 0 },
			checkInDate,
			checkOutDate
		);

		const property = calculateStayPricing(pricing, checkInDate, checkOutDate);
		const usesPropertyDiscount = discountMode === 'stack' || !loyaltyWins;
		const propertySavingsMinor = usesPropertyDiscount
			? original.totalMinor - property.totalMinor
			: 0;
		const breakfast = services.breakfast ? reward.breakfast : 'none';

		benefits = {
			level: reward.level,
			discountMode,
			propertyDiscountBps: usesPropertyDiscount ? pricing.discountBps : 0,
			loyaltyDiscountBps: discountMode === 'stack' || loyaltyWins ? loyaltyBps : 0,
			propertySavingsMinor,
			loyaltySavingsMinor: original.totalMinor - propertySavingsMinor - stayPricing.totalMinor,
			parking: services.parking && reward.parking,
			breakfast,
			breakfastGuests:
				breakfast === 'all' ? guests : breakfast === 'up_to_two' ? Math.min(2, guests) : 0,
			spa: services.spa && reward.spa
		};
	}
	
	return { pricing: { ...finalPricing, effectivePricePerNightMinor }, stayPricing, benefits };
}
