// TYPES
import type { Doc } from '../../_generated/dataModel.js';
import type {
	BookingCancellation,
	BookingCancellationTerms
} from '../../../shared/features/bookings/types/bookingTypes.js';

export type EmailOTPType = 'sign-in' | 'change-email' | 'email-verification' | 'forget-password';

export type EmailRecipient = string | string[];

export type OtpEmailData = {
	email: string;
	otp: string;
	type: EmailOTPType;
};

export type DeleteAccountEmailData = {
	name: string;
	email: string;
	url: string;
};

export type BookingRecoveryEmailData = {
	email: string;
	url: string;
	locale: string;
};

export type SendEmailOptions = {
	idempotencyKey?: string;
	to: EmailRecipient;
	replyTo?: string;
	subject: string;
	content: string;
	text?: string;
	previewText?: string;
};

export type BookingCancellationEmailData = {
	bookingId: string;
	recipient: 'guest' | 'host';
	email: string;
	accommodationName: string;
	locale: string;
	booking: {
		cancellation: BookingCancellation;
		cancellationTerms: BookingCancellationTerms;
		firstName: string;
		lastName: string;
	};
};

export type BookingCancellationEmailBodyData = {
	accommodationName: string;
	guestName: string;
	checkIn: string;
	cancellation: BookingCancellation;
	recipient: BookingCancellationEmailData['recipient'];
	url: string;
};

export type BookingRequestEmailData = {
	bookingId: string;
	recipient: 'guest' | 'host';
	email: string;
	accommodationName: string;
	booking: Pick<
		Doc<'bookings'>,
		| 'email'
		| 'firstName'
		| 'lastName'
		| 'phone'
		| 'specialRequests'
		| 'adults'
		| 'children'
		| 'cancellationTerms'
	>;
};

export type BookingRequestEmailBodyData = {
	accommodationName: string;
	guestName: string;
	checkIn: string;
	checkOut: string;
	adults: number;
	children: number;
	phone: string;
	specialRequests?: string;
	recipient: BookingRequestEmailData['recipient'];
	url: string;
	findBookingUrl: string;
};
