// EMAILS
import { sendEmail } from '../../../emails/sendEmail.js';
import { sendBookingCancellationEmailTranslation } from '../../../emails/translations/sendBookingCancellationEmailTranslation.js';

// DATA
import { EMAIL_DATA } from '../../../emails/data/emailData.js';

// UTILS
import { getTranslationLocale } from '../../../utils/getTranslationLocale.js';
import { escapeHtml } from '../../../../shared/utils/escapeHtml.js';
import { formatZonedDateTime } from '../../../../shared/features/timezone/utils/formatZonedDateTime.js';
import { formatFullName } from '../../../../shared/utils/formatFullName.js';

// TYPES
import type {
	BookingCancellationEmailData,
	BookingCancellationEmailBodyData
} from '../../../emails/types/emailTypes.js';

export async function sendBookingCancellationEmail(
	ctx: Parameters<typeof sendEmail>[0],
	data: BookingCancellationEmailData
): ReturnType<typeof sendEmail> {
	const copy = getTranslationLocale(data.locale, sendBookingCancellationEmailTranslation);

	const { cancellation, cancellationTerms } = data.booking;

	const { subject, heading, body } = copy;
	const emailSubject = subject[cancellation.kind][data.recipient];
	const emailHeading = heading[cancellation.kind][data.recipient];
	const { COLORS, TYPOGRAPHY } = EMAIL_DATA;

	const url = new URL(
		data.recipient === 'host' ? '/host/bookings' : '/guest/my-bookings',
		EMAIL_DATA.BRAND.URL
	).toString();

	const bodyData: BookingCancellationEmailBodyData = {
		accommodationName: data.accommodationName,
		guestName: formatFullName(data.booking.firstName, data.booking.lastName),
		checkIn: `${formatZonedDateTime(cancellationTerms.checkInAt, 'en', cancellationTerms.timeZone)} (${cancellationTerms.timeZone})`,
		cancellation,
		recipient: data.recipient,
		url
	};

	return sendEmail(ctx, {
		to: data.email,
		subject: emailSubject,
		previewText: emailHeading,
		idempotencyKey: `booking-cancellation/${data.bookingId}/${data.recipient}`,
		text: `${emailHeading}\n\n${body.text(bodyData)}`,
		content: `
			<h1 style="margin:0 0 16px;font-family:${TYPOGRAPHY.FONT_FAMILY};font-size:28px;line-height:36px;color:${COLORS.FOREGROUND};">${escapeHtml(emailHeading)}</h1>
			${body.html(bodyData)}
		`
	});
}
