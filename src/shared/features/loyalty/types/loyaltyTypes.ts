// DATA
import type { LOYALTY_LEVELS } from '../data/loyaltyData.js';

export type LoyaltyLevel = 0 | 1 | 2 | 3;
export type LoyaltyDiscountMode = 'best' | 'stack';
export type LoyaltyServices = { parking: boolean; breakfast: boolean; spa: boolean };

/** A configured loyalty tier and the benefits it includes. */
export type LoyaltyTier = (typeof LOYALTY_LEVELS)[number];

/** Nightly rates and discounts quoted by the pricing helpers. */
export type NightlyPricing = {
	pricePerNightMinor: number;
	discountBps: number;
	loyaltyDiscountBps?: number;
	weekendPricePerNightMinor?: number | null;
};

/** Accepted booking terms, never reconstructed from the current member or property. */
export type LoyaltyBookingBenefits = {
	level: 1 | 2 | 3;
	discountMode: LoyaltyDiscountMode;
	propertyDiscountBps: number;
	loyaltyDiscountBps: number;
	propertySavingsMinor: number;
	loyaltySavingsMinor: number;
	parking: boolean;
	breakfast: 'none' | 'up_to_two' | 'all';
	breakfastGuests: number;
	spa: boolean;
};
