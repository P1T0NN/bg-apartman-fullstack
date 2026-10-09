import { LOYALTY_CONFIG } from '../../../../shared/features/loyalty/config.js';
import { getLoyaltyMembership } from './getLoyaltyMembership.js';
import type { Doc } from '../../../_generated/dataModel.js';
import type { QueryCtx } from '../../../_generated/server.js';

export async function getBookingBenefitsContext(
	ctx: Pick<QueryCtx, 'db'>,
	accommodation: Doc<'accommodations'>,
	ownerId: string | undefined
) {
	const membership = ownerId ? await getLoyaltyMembership(ctx, ownerId) : null;
	const participates = LOYALTY_CONFIG.BOOKING_ENABLED && accommodation.loyaltyEligible === true;
	return {
		level: membership?.level ?? 0,
		services: participates
			? (accommodation.loyaltyServices ?? { parking: false, breakfast: false, spa: false })
			: null,
		discountMode: participates ? LOYALTY_CONFIG.DISCOUNT_MODE : null
	};
}
