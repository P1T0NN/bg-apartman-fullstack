// CONFIG
import { REVIEWS_CONFIG } from '../config.js';

// UTILS
import { DAY_IN_MS } from '../../../utils/date.js';

/** Booking dates use UTC throughout this project; the window ends 90 days after departure. */
export function getReviewDeadline(checkOutDate: string): number {
	return Date.parse(checkOutDate) + REVIEWS_CONFIG.REVIEW_WINDOW_DAYS * DAY_IN_MS;
}
