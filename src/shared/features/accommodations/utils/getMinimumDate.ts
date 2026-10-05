// UTILS
import { getZonedTimestamp } from '@/shared/features/timezone/utils/getZonedTimestamp.js';
import { parseIsoDate } from '@/shared/utils/date.js';

// TYPES
import type { PublicAccommodation } from '../types/accommodationTypes.js';

/**
 * First selectable arrival date in the property's timezone: today while the
 * guest can still arrive before check-in start, otherwise tomorrow. Returns
 * undefined when the property-local date cannot be parsed.
 */
export function getMinimumDate(
	currentDate: string,
	currentTimestamp: number,
	accommodation: Pick<PublicAccommodation, 'sameDayReservation' | 'checkInStart' | 'timeZone'>
) {
	const today = parseIsoDate(currentDate);
	if (!today) return undefined;
	try {
		const canArriveToday =
			accommodation.sameDayReservation &&
			currentTimestamp <
				getZonedTimestamp(currentDate, accommodation.checkInStart, accommodation.timeZone);
		return canArriveToday ? today : today.add({ days: 1 });
	} catch {
		return today.add({ days: 1 });
	}
}
