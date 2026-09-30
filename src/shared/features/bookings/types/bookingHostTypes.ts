// TYPES
import type { Doc } from '@convex/_generated/dataModel';
import type { BookingStatus } from '../schemas/bookingSchemas.js';

/** Accommodation summary enriched onto each host booking row. */
export type BookingAccommodation = {
	name: string;
	city: string;
	country: string;
	imageUrl: string | null;
};

/** Enriched host booking row: the stored booking plus its accommodation summary. */
export type HostBookingItem = Doc<'bookings'> & {
	accommodation: BookingAccommodation | null;
};

/** Booking statuses the host actions component can send; the server enforces the transition map. */
export type HostBookingAction = Exclude<BookingStatus, 'pending'>;
