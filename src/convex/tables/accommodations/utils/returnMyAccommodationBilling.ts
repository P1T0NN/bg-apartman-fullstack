// LIBRARIES
import { pick } from 'convex-helpers';

// TYPES
import type { Doc } from '../../../_generated/dataModel.js';

export function returnMyAccommodationBilling(accommodation: Doc<'accommodations'>) {
	return pick(accommodation, [
		'billingPlanId',
		'billingTerms',
		'billingStatus',
		'billingPeriodEndsAt',
		'status'
	]);
}
