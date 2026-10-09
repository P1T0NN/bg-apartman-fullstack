import { LOYALTY_LEVELS } from '../data/loyaltyData.js';

export function getLoyaltyLevel(qualifyingStays: number) {
	return LOYALTY_LEVELS.findLast((tier) => qualifyingStays >= tier.stays)?.level ?? 0;
}
