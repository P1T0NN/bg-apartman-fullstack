// UTILS
import { DAY_IN_MS } from '../../../utils/date.js';
import { ACCOMMODATION_CONFIG } from '../../accommodations/config.js';

// TYPES
import type { BookingCancellationTerms } from '../types/bookingTypes.js';

/** Threshold instants use elapsed hours, including across daylight-saving changes. */
export function calculateBookingCancellationDeadlines(
	terms: Pick<BookingCancellationTerms, 'checkInAt'>
) {
	const hours = ACCOMMODATION_CONFIG.CANCELLATION_POLICY_DEADLINE_HOURS;

	return {
		sevenDaysOrMore: terms.checkInAt - (hours.sevenDaysOrMore * DAY_IN_MS) / 24,
		fiveToSevenDays: terms.checkInAt - (hours.fiveToSevenDays * DAY_IN_MS) / 24,
		threeToFiveDays: terms.checkInAt - (hours.threeToFiveDays * DAY_IN_MS) / 24,
		oneToThreeDays: terms.checkInAt - (hours.oneToThreeDays * DAY_IN_MS) / 24
	};
}
