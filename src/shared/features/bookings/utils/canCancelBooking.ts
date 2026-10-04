// UTILS
import { calculateBookingRequestExpiry } from './calculateBookingRequestExpiry.js';

// TYPES
import type { BookingStatus } from '../schemas/bookingSchemas.js';
import type { BookingCancellationTerms } from '../types/bookingTypes.js';

/** Scheduled check-in is the exclusive boundary, even if the status is still active. */
export function canCancelBooking(
	booking: {
		status: BookingStatus;
		_creationTime?: number;
		requestExpiresAt?: number;
		cancellationTerms: Pick<BookingCancellationTerms, 'checkInAt'>;
	},
	now: number
): boolean {
	if (booking.status === 'pending' && booking._creationTime !== undefined) {
		return (
			now < calculateBookingRequestExpiry({ ...booking, _creationTime: booking._creationTime })
		);
	}

	if (booking.status === 'pending' && booking.requestExpiresAt !== undefined) {
		return now < booking.requestExpiresAt;
	}

	return (
		(booking.status === 'pending' || booking.status === 'confirmed') &&
		now < booking.cancellationTerms.checkInAt
	);
}
