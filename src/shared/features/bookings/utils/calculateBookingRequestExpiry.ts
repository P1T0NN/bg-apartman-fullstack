// CONFIG
import { BOOKINGS_CONFIG } from '../config.js';

/** Legacy pending requests use creation time; saved deadlines never change with listing edits. */
export function calculateBookingRequestExpiry(booking: {
	_creationTime: number;
	requestExpiresAt?: number;
	cancellationTerms: { checkInAt: number };
}): number {
	return (
		booking.requestExpiresAt ??
		Math.min(
			booking._creationTime + BOOKINGS_CONFIG.REQUEST_RESPONSE_WINDOW_MS,
			booking.cancellationTerms.checkInAt
		)
	);
}
