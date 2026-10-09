// UTILS
import { calculateBookingCancellationDeadlines } from './calculateBookingCancellationDeadlines.js';
import { ACCOMMODATION_CONFIG } from '../../accommodations/config.js';
import { DAY_IN_MS } from '../../../utils/date.js';

// TYPES
import type { BookingCancellationTerms } from '../types/bookingTypes.js';

/** Null means the pre-check-in policy no longer applies. Every booking has terms. */
export function checkBookingCancellationRefund(
	terms: Pick<BookingCancellationTerms, 'policy' | 'checkInAt' | 'refundDeadlineAt'>,
	now: number
) {
	if (now >= terms.checkInAt) return null;

	if (terms.policy.mode === 'full_refund') return 100;
	if (terms.policy.mode !== 'custom') {
		const deadline =
			terms.refundDeadlineAt ??
			terms.checkInAt -
				(ACCOMMODATION_CONFIG.CANCELLATION_POLICY_HOURS[terms.policy.mode] * DAY_IN_MS) / 24;
		return now <= deadline ? 100 : 0;
	}

	const deadlines = calculateBookingCancellationDeadlines(terms);

	if (now <= deadlines.sevenDaysOrMore) return 100;
	if (now <= deadlines.fiveToSevenDays) return terms.policy.fiveToSevenDays;
	if (now <= deadlines.threeToFiveDays) return terms.policy.threeToFiveDays;
	if (now <= deadlines.oneToThreeDays) return terms.policy.oneToThreeDays;

	return terms.policy.under24Hours;
}
