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
	return {
		level: membership?.level ?? 0,
		services: LOYALTY_CONFIG.BOOKING_ENABLED ? (accommodation.loyaltyServices ?? null) : null,
		discountMode: LOYALTY_CONFIG.BOOKING_ENABLED ? LOYALTY_CONFIG.DISCOUNT_MODE : null
	};
}
