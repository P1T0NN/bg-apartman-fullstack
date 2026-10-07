// CONFIG
import { ACCOMMODATION_BILLING_PLANS } from '../../src/shared/features/accommodations/config.js';

// TYPES
import type { Doc } from '../../src/convex/_generated/dataModel.js';

export const bookingFeeBilling = {
	billingPlanId: 'booking_fee',
	billingTerms: ACCOMMODATION_BILLING_PLANS.booking_fee,
	billingStatus: 'active',
	billingPeriodEndsAt: null
} satisfies Pick<
	Doc<'accommodations'>,
	'billingPlanId' | 'billingTerms' | 'billingStatus' | 'billingPeriodEndsAt'
>;
