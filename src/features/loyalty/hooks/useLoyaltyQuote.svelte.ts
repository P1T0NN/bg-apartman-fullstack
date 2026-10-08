import { useQuery } from 'convex-svelte';
import { api } from '@convex/_generated/api';
import { calculateLoyaltyQuote } from '@/shared/features/loyalty/utils/calculateLoyaltyQuote.js';
import type { PublicAccommodation } from '@/shared/features/accommodations/types/accommodationTypes.js';

export function useLoyaltyQuote(input: {
	accommodation: () => PublicAccommodation;
	paymentMethod: () => string;
	checkInDate: () => string;
	checkOutDate: () => string;
	guests: () => number;
}) {
	const result = useQuery(
		api.tables.loyaltyMemberships.queries.fetchBookingBenefits.fetchBookingBenefits,
		() => ({ accommodationId: input.accommodation()._id })
	);
	const quote = $derived(
		calculateLoyaltyQuote(
			input.accommodation(),
			input.checkInDate(),
			input.checkOutDate(),
			input.paymentMethod() === 'cash' ? (result.data?.level ?? 0) : 0,
			result.data?.services ?? null,
			input.guests(),
			result.data?.discountMode ?? null
		)
	);
	return {
		result,
		get quote() {
			return quote;
		}
	};
}
