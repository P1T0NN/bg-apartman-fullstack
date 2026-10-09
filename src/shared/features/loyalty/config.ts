import type { LoyaltyDiscountMode } from './types/loyaltyTypes.js';

type LoyaltyProgramConfig = {
	BOOKING_ENABLED: boolean;
	DISCOUNT_MODE: LoyaltyDiscountMode | null;
};
export const LOYALTY_CONFIG: LoyaltyProgramConfig = {
	BOOKING_ENABLED: true,
	DISCOUNT_MODE: 'best'
};
