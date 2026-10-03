// CONFIG
import { REVIEWS_CONFIG } from '../config.js';

// UTILS
import { parseDate } from '@internationalized/date';

/** Exclusive start of the 90th calendar day after checkout, in the booking's property zone. */
export function getReviewDeadline(checkOutDate: string, timeZone: string): number {
	return parseDate(checkOutDate)
		.add({ days: REVIEWS_CONFIG.REVIEW_WINDOW_DAYS })
		.toDate(timeZone)
		.getTime();
}
