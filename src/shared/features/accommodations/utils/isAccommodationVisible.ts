// TYPES
import type { Doc } from '../../../../convex/_generated/dataModel.js';

type VisibilityFields = Pick<
	Doc<'accommodations'>,
	'status' | 'billingPlanId' | 'billingStatus' | 'billingPeriodEndsAt'
>;

/** Publication, billing eligibility and payout readiness control public access. */
export function isAccommodationVisible<T extends VisibilityFields>(
	accommodation: T | null | undefined,
	payoutsEnabled: boolean,
	now = Date.now()
): accommodation is T {
	if (!accommodation || accommodation.status !== 'published') return false;
	if (accommodation.billingStatus !== 'active') return false;
	if (!payoutsEnabled) return false;

	return (
		accommodation.billingPlanId === 'booking_fee' ||
		accommodation.billingPlanId === 'free' ||
		(accommodation.billingPeriodEndsAt !== null && accommodation.billingPeriodEndsAt > now)
	);
}
