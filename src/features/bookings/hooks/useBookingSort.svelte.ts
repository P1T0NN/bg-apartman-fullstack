// HOOKS
import { useSearchParams } from '@/hooks/useSearchParams.svelte.js';

// CONFIG
import { DEFAULT_BOOKING_SORT } from '@/shared/features/bookings/config.js';

// DATA
import { BOOKING_SORTS } from '@/shared/features/bookings/data/bookingsData.js';

// TYPES
import type { BookingSort } from '@/shared/features/bookings/types/bookingTypes.js';

/**
 * URL-backed booking date sort. `defaultSort` supplies the effective value when
 * the URL has none (the host page defaults pending lists to oldest first).
 */
export function useBookingSort(defaultSort: () => BookingSort = () => DEFAULT_BOOKING_SORT) {
	const params = useSearchParams(['sort'], { history: 'push' });

	const sort = $derived(
		BOOKING_SORTS.find((value) => value === params.get('sort')) ?? defaultSort()
	);

	return {
		get sort() {
			return sort;
		},
		setSort(value: BookingSort) {
			params.write({ sort: value === defaultSort() ? '' : value });
		}
	};
}
