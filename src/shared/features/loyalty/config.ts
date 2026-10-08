import type { LoyaltyDiscountMode } from './types/loyaltyTypes.js';

// ponytail: keep live application off until the eligibility and combination rules are approved.
type LoyaltyProgramConfig = {
	BOOKING_ENABLED: boolean;
	DISCOUNT_MODE: LoyaltyDiscountMode | null;
};
export const LOYALTY_CONFIG: LoyaltyProgramConfig = { BOOKING_ENABLED: false, DISCOUNT_MODE: null };
