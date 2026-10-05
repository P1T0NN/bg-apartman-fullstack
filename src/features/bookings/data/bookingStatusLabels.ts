// CONFIG
import { m } from '@/lib/paraglide/messages';

// TYPES
import type { BookingStatus } from '@/shared/features/bookings/types/bookingTypes.js';

/** Translated booking status labels; functions keep them live across locale changes. */
export const BOOKING_STATUS_LABELS = {
	pending: () => m['BookingsFeature.status.pending'](),
	confirmed: () => m['BookingsFeature.status.confirmed'](),
	declined: () => m['BookingsFeature.status.declined'](),
	cancelled: () => m['BookingsFeature.status.cancelled'](),
	expired: () => m['BookingsFeature.status.expired'](),
	completed: () => m['BookingsFeature.status.completed']()
} satisfies Record<BookingStatus, () => string>;
