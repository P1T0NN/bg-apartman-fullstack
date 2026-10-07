// TYPES
import type { Doc } from '../../../../convex/_generated/dataModel.js';

type RefundFields = Pick<
	Doc<'accommodations'>,
	'billingPlanId' | 'billingTerms' | 'billingStatus' | 'billingPeriodEndsAt' | 'updatedAt'
>;

export function canRefundAccommodationFlatFee(
	accommodation: RefundFields,
	expectedBillingPeriodEndsAt: number,
	expectedUpdatedAt: number,
	now: number
): boolean {
	return (
		accommodation.billingPlanId === 'flat_fee' &&
		accommodation.billingTerms.model === 'flat_fee' &&
		accommodation.billingStatus === 'active' &&
		accommodation.billingPeriodEndsAt !== null &&
		accommodation.billingPeriodEndsAt > now &&
		accommodation.billingPeriodEndsAt === expectedBillingPeriodEndsAt &&
		accommodation.updatedAt === expectedUpdatedAt
	);
}
