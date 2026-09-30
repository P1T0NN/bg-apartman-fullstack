// UTILS
import { DAY_IN_MS } from '../../../utils/date.js';

/** Whole nights between two ISO dates; never below one night. */
export function getBookingNights(checkInDate: string, checkOutDate: string): number {
	return Math.max(1, Math.round((Date.parse(checkOutDate) - Date.parse(checkInDate)) / DAY_IN_MS));
}
