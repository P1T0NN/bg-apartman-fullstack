import type { LoyaltyBookingBenefits } from '../types/loyaltyTypes.js';

/** All accepted terms are scalars; object key ordering must not affect stale-offer checks. */
export function areLoyaltyBenefitsEqual(
	expected: LoyaltyBookingBenefits | null | undefined,
	actual: LoyaltyBookingBenefits | null
) {
	if (!expected || !actual) return (expected ?? null) === actual;
	// SAFETY: the quote calculator builds actual with only the declared scalar benefit fields.
	return (Object.keys(actual) as (keyof LoyaltyBookingBenefits)[]).every(
		(key) => expected[key] === actual[key]
	);
}
