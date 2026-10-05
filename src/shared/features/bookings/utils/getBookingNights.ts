// UTILS
import { DAY_IN_MS } from '../../../utils/date.js';

/** Whole nights between two ISO dates; day-use stays have zero nights. */
export function getBookingNights(checkInDate: string, checkOutDate: string): number {
	return Math.max(0, Math.round((Date.parse(checkOutDate) - Date.parse(checkInDate)) / DAY_IN_MS));
}
