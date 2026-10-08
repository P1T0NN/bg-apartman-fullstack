// EMAILS
import { sendEmail } from '../../../emails/sendEmail.js';
import { formatLoyaltyBookingBenefits } from '../../loyaltyMemberships/emails/formatLoyaltyBookingBenefits.js';
import { sendBookingConfirmationEmailTranslation } from '../../../emails/translations/sendBookingConfirmationEmailTranslation.js';

// UTILS
import { escapeHtml } from '../../../../shared/utils/escapeHtml.js';
import { formatZonedDateTime } from '../../../../shared/features/timezone/utils/formatZonedDateTime.js';
import { formatFullName } from '../../../../shared/utils/formatFullName.js';

// DATA
import { EMAIL_DATA } from '../../../emails/data/emailData.js';

// TYPES
import type {
	BookingGuestEmailData,
	BookingConfirmationEmailBodyData
} from '../../../emails/types/emailTypes.js';

export async function sendBookingConfirmationEmail(
	ctx: Parameters<typeof sendEmail>[0],
	data: BookingGuestEmailData & { hostEmail?: string }
): ReturnType<typeof sendEmail> {
	const { subject, heading, instantSubject, instantHeading, hostSubject, hostHeading, body } =
		sendBookingConfirmationEmailTranslation.en;

	const { COLORS, TYPOGRAPHY } = EMAIL_DATA;

	const terms = data.booking.cancellationTerms;
	const benefits = formatLoyaltyBookingBenefits(terms);
	const host = data.hostEmail !== undefined;
	const instant = data.booking.bookingMode === 'instant';
	const emailHeading = host ? hostHeading : instant ? instantHeading : heading;

	const bodyData: BookingConfirmationEmailBodyData = {
		host,
		instant,
		phone: data.booking.phone,
		specialRequests: data.booking.specialRequests,
		accommodationName: data.accommodationName,
		guestName: formatFullName(data.booking.firstName, data.booking.lastName),
		checkIn: `${formatZonedDateTime(terms.checkInAt, 'en', terms.timeZone)} (${terms.timeZone})`,
		checkOut: `${formatZonedDateTime(terms.checkOutAt, 'en', terms.timeZone)} (${terms.timeZone})`,
		adults: data.booking.adults,
		children: data.booking.children,
		url: new URL(
			host ? '/host/bookings?status=confirmed' : `/book-confirmation/${data.bookingId}`,
			EMAIL_DATA.BRAND.URL
		).toString(),
		findBookingUrl: new URL('/find-booking', EMAIL_DATA.BRAND.URL).toString()
	};

	return sendEmail(ctx, {
		to: data.hostEmail ?? data.booking.email,
		replyTo: host ? data.booking.email : undefined,
		subject: host ? hostSubject : instant ? instantSubject : subject,
		previewText: emailHeading,
		idempotencyKey: `booking-confirmation/${data.bookingId}/${host ? 'host' : 'guest'}`,
		text: [emailHeading, body.text(bodyData), ...benefits].join('\n\n'),
		content: `
			<h1 style="margin:0 0 16px;font-family:${TYPOGRAPHY.FONT_FAMILY};font-size:28px;line-height:36px;color:${COLORS.FOREGROUND};">${escapeHtml(emailHeading)}</h1>
			${body.html(bodyData)}
			${benefits.map((line) => `<p>${escapeHtml(line)}</p>`).join('')}
		`
	});
}
