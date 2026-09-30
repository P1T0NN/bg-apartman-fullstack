// CONFIG
import { BOOKING_STATUSES } from '../../../../shared/features/bookings/schemas/bookingSchemas.js';

// TYPES
import type { BookingStatus } from '../../../../shared/features/bookings/schemas/bookingSchemas.js';

export type BookingFilters = {
	status?: BookingStatus;
};

function isBookingStatus(value: string | undefined): value is BookingStatus {
	return value !== undefined && BOOKING_STATUSES.some((status) => status === value);
}

/** Read the validated booking filter values from the symbolic filter record. */
export function readBookingFilters(filters: Record<string, string> | undefined): BookingFilters {
	const status = filters?.status;

	return {
		status: isBookingStatus(status) ? status : undefined
	};
}
