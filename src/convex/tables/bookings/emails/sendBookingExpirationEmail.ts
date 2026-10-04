// EMAILS
import { sendEmail } from '../../../emails/sendEmail.js';
import { sendBookingExpirationEmailTranslation } from '../../../emails/translations/sendBookingExpirationEmailTranslation.js';

// UTILS
import { escapeHtml } from '../../../../shared/utils/escapeHtml.js';
import { formatZonedDateTime } from '../../../../shared/features/timezone/utils/formatZonedDateTime.js';
import { formatFullName } from '../../../../shared/utils/formatFullName.js';

// DATA
import { EMAIL_DATA } from '../../../emails/data/emailData.js';

// TYPES
import type {
	BookingGuestEmailData,
	BookingGuestEmailBodyData
} from '../../../emails/types/emailTypes.js';

export async function sendBookingExpirationEmail(
	ctx: Parameters<typeof sendEmail>[0],
	data: BookingGuestEmailData
): ReturnType<typeof sendEmail> {
	const { subject, heading, body } = sendBookingExpirationEmailTranslation.en;

	const { COLORS, TYPOGRAPHY } = EMAIL_DATA;

	const terms = data.booking.cancellationTerms;

	const bodyData: BookingGuestEmailBodyData = {
		accommodationName: data.accommodationName,
		guestName: formatFullName(data.booking.firstName, data.booking.lastName),
		checkIn: `${formatZonedDateTime(terms.checkInAt, 'en', terms.timeZone)} (${terms.timeZone})`,
		checkOut: `${formatZonedDateTime(terms.checkOutAt, 'en', terms.timeZone)} (${terms.timeZone})`,
		adults: data.booking.adults,
		children: data.booking.children,
		url: new URL(`/book-confirmation/${data.bookingId}`, EMAIL_DATA.BRAND.URL).toString(),
		findBookingUrl: new URL('/find-booking', EMAIL_DATA.BRAND.URL).toString()
	};

	return sendEmail(ctx, {
		to: data.booking.email,
		subject,
		previewText: heading,
		idempotencyKey: `booking-expiration/${data.bookingId}/guest`,
		text: `${heading}\n\n${body.text(bodyData)}`,
		content: `
			<h1 style="margin:0 0 16px;font-family:${TYPOGRAPHY.FONT_FAMILY};font-size:28px;line-height:36px;color:${COLORS.FOREGROUND};">${escapeHtml(heading)}</h1>
			${body.html(bodyData)}
		`
	});
}
