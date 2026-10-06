// TYPES
import type { Doc } from '../../../../convex/_generated/dataModel.js';

// DATA
import type { BOOKING_SORTS, BOOKING_STATUSES } from '../data/bookingsData.js';

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export type BookingSort = (typeof BOOKING_SORTS)[number];

/** Aggregate key for per-owner booking totals. */
export type BookingOwnerAggregateKey = number;

export type BookingRecoveryAccess = Pick<Doc<'bookingRecoveryTokens'>, 'email' | 'expiresAt'>;

export type BookingCancellationTerms = Doc<'bookings'>['cancellationTerms'];

export type BookingCancellation = NonNullable<Doc<'bookings'>['cancellation']>;

export type BookingCheckoutValues = Pick<
	Doc<'bookings'>,
	| 'checkInDate'
	| 'checkOutDate'
	| 'adults'
	| 'children'
	| 'firstName'
	| 'lastName'
	| 'email'
	| 'phone'
	| 'specialRequests'
> & { paymentMethod: 'cash' | 'online' | '' };

export type Booking = Pick<
	Doc<'bookings'>,
	| 'paymentMethod'
	| '_id'
	| 'accommodationId'
	| 'status'
	| 'firstName'
	| 'lastName'
	| 'email'
	| 'phone'
	| 'specialRequests'
	| 'checkInDate'
	| 'checkOutDate'
	| 'adults'
	| 'children'
> & {
	accommodationName: string;
	isClaimable: boolean;
	cancellationTerms: BookingCancellationTerms;
};
