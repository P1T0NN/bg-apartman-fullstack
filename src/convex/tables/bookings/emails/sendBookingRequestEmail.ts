// EMAILS
import { sendEmail } from '../../../emails/sendEmail.js';
import { formatLoyaltyBookingBenefits } from '../../loyaltyMemberships/emails/formatLoyaltyBookingBenefits.js';
import { sendBookingRequestEmailTranslation } from '../../../emails/translations/sendBookingRequestEmailTranslation.js';

// DATA
import { EMAIL_DATA } from '../../../emails/data/emailData.js';

// UTILS
import { escapeHtml } from '../../../../shared/utils/escapeHtml.js';
import { formatZonedDateTime } from '../../../../shared/features/timezone/utils/formatZonedDateTime.js';
import { formatFullName } from '../../../../shared/utils/formatFullName.js';

// TYPES
import type {
	BookingRequestEmailData,
	BookingRequestEmailBodyData
} from '../../../emails/types/emailTypes.js';

export async function sendBookingRequestEmail(
	ctx: Parameters<typeof sendEmail>[0],
	data: BookingRequestEmailData
): ReturnType<typeof sendEmail> {
	const { subject, heading, body } = sendBookingRequestEmailTranslation.en;

	const { COLORS, TYPOGRAPHY } = EMAIL_DATA;

	const terms = data.booking.cancellationTerms;
	const benefits = formatLoyaltyBookingBenefits(terms);

	const path =
		data.recipient === 'host' ? '/host/bookings' : `/book-confirmation/${data.bookingId}`;

	const bodyData: BookingRequestEmailBodyData = {
		accommodationName: data.accommodationName,
		guestName: formatFullName(data.booking.firstName, data.booking.lastName),
		checkIn: `${formatZonedDateTime(terms.checkInAt, 'en', terms.timeZone)} (${terms.timeZone})`,
		checkOut: `${formatZonedDateTime(terms.checkOutAt, 'en', terms.timeZone)} (${terms.timeZone})`,
		adults: data.booking.adults,
		children: data.booking.children,
		phone: data.booking.phone,
		specialRequests: data.booking.specialRequests,
		recipient: data.recipient,
		url: new URL(path, EMAIL_DATA.BRAND.URL).toString(),
		findBookingUrl: new URL('/find-booking', EMAIL_DATA.BRAND.URL).toString()
	};

	const emailHeading = heading[data.recipient];

	return sendEmail(ctx, {
		to: data.email,
		replyTo: data.recipient === 'host' ? data.booking.email : undefined,
		subject: subject[data.recipient],
		previewText: emailHeading,
		idempotencyKey: `booking-request/${data.bookingId}/${data.recipient}`,
		text: [emailHeading, body.text(bodyData), ...benefits].join('\n\n'),
		content: `
			<h1 style="margin:0 0 16px;font-family:${TYPOGRAPHY.FONT_FAMILY};font-size:28px;line-height:36px;color:${COLORS.FOREGROUND};">${escapeHtml(emailHeading)}</h1>
			${body.html(bodyData)}
			${benefits.map((line) => `<p>${escapeHtml(line)}</p>`).join('')}
		`
	});
}
