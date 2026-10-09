// TYPES
import type { BookingStatus } from '../types/bookingTypes.js';

export const BOOKING_STATUSES = [
	'pending',
	'confirmed',
	'declined',
	'cancelled',
	'expired',
	'completed'
] as const;

/** Date ordering for the booking lists; `newest` is the shared default. */
export const BOOKING_SORTS = ['newest', 'oldest'] as const;

/** Finished booking states a host may remove from their workspace. */
export const BOOKING_ARCHIVABLE_STATUSES: readonly BookingStatus[] = [
	'cancelled',
	'declined',
	'expired',
	'completed'
];

/** Allowed host-driven status changes; every other status is terminal. */
export const BOOKING_STATUS_TRANSITIONS = {
	pending: ['confirmed', 'declined', 'cancelled'],
	confirmed: ['completed', 'cancelled'],
	declined: [],
	cancelled: [],
	expired: [],
	completed: []
} satisfies Record<BookingStatus, readonly BookingStatus[]>;
