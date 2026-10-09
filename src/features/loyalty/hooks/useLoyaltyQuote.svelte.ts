// LIBRARIES
import { useQuery } from 'convex-svelte';
import { api } from '@convex/_generated/api';

// CONFIG
import { LOYALTY_CONFIG } from '@/shared/features/loyalty/config.js';

// UTILS
import { calculateLoyaltyQuote } from '@/shared/features/loyalty/utils/calculateLoyaltyQuote.js';

// TYPES
import type { NightlyPricing } from '@/shared/features/loyalty/types/loyaltyTypes.js';
import type { Doc } from '@convex/_generated/dataModel';

export function useLoyaltyQuote(input: {
	accommodation: () => NightlyPricing & Pick<Doc<'accommodations'>, '_id' | 'loyaltyEligible'>;
	checkInDate: () => string;
	checkOutDate: () => string;
	guests: () => number;
}) {
	const canUseLoyalty = $derived(
		LOYALTY_CONFIG.BOOKING_ENABLED && input.accommodation().loyaltyEligible
	);

	const result = useQuery(
		api.tables.loyaltyMemberships.queries.fetchBookingBenefits.fetchBookingBenefits,
		() => (canUseLoyalty ? { accommodationId: input.accommodation()._id } : 'skip')
	);

	const quote = $derived(
		calculateLoyaltyQuote(
			input.accommodation(),
			input.checkInDate(),
			input.checkOutDate(),
			canUseLoyalty ? (result.data?.level ?? 0) : 0,
			canUseLoyalty ? (result.data?.services ?? null) : null,
			input.guests(),
			canUseLoyalty ? (result.data?.discountMode ?? null) : null
		)
	);

	return {
		result,
		get quote() {
			return quote;
		}
	};
}
