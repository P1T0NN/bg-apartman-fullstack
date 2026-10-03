// UTILS
import { calculateBookingCancellationDeadlines } from './calculateBookingCancellationDeadlines.js';

// TYPES
import type { BookingCancellationTerms } from '../types/bookingTypes.js';

/** Null means the pre-check-in policy no longer applies. Every booking has terms. */
export function checkBookingCancellationRefund(
	terms: Pick<BookingCancellationTerms, 'policy' | 'checkInAt'>,
	now: number
) {
	if (now >= terms.checkInAt) return null;

	if (terms.policy.mode === 'full_refund') return 100;

	const deadlines = calculateBookingCancellationDeadlines(terms);

	if (now <= deadlines.sevenDaysOrMore) return 100;
	if (now <= deadlines.fiveToSevenDays) return terms.policy.fiveToSevenDays;
	if (now <= deadlines.threeToFiveDays) return terms.policy.threeToFiveDays;
	if (now <= deadlines.oneToThreeDays) return terms.policy.oneToThreeDays;

	return terms.policy.under24Hours;
}
