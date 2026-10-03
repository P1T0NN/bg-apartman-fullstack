// TYPES
import type { BookingStatus } from '../schemas/bookingSchemas.js';
import type { BookingCancellationTerms } from '../types/bookingTypes.js';

/** Scheduled check-in is the exclusive boundary, even if the status is still active. */
export function canCancelBooking(
	booking: {
		status: BookingStatus;
		cancellationTerms: Pick<BookingCancellationTerms, 'checkInAt'>;
	},
	now: number
): boolean {
	return (
		(booking.status === 'pending' || booking.status === 'confirmed') &&
		now < booking.cancellationTerms.checkInAt
	);
}
