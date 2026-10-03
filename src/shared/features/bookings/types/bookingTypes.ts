// TYPES
import type { Doc } from '../../../../convex/_generated/dataModel.js';

/** Aggregate key for per-owner booking totals. */
export type BookingOwnerAggregateKey = number;

export type BookingRecoveryAccess = Pick<Doc<'bookingRecoveryTokens'>, 'email' | 'expiresAt'>;

export type BookingCancellationTerms = Doc<'bookings'>['cancellationTerms'];

export type BookingCancellation = NonNullable<Doc<'bookings'>['cancellation']>;

export type Booking = Pick<
	Doc<'bookings'>,
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
