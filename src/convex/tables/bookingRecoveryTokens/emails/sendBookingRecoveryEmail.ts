// CONFIG
import { BOOKINGS_CONFIG } from '../../../../shared/features/bookings/config.js';

// UTILS
import { getTranslationLocale } from '../../../utils/getTranslationLocale.js';
import { sendBookingRecoveryEmailTranslation } from '../../../emails/translations/sendBookingRecoveryEmailTranslation.js';
import { escapeHtml } from '../../../../shared/utils/escapeHtml.js';
import { sendEmail } from '../../../emails/sendEmail.js';

// DATA
import { EMAIL_DATA } from '../../../emails/data/emailData.js';

// TYPES
import type { BookingRecoveryEmailData } from '../../../emails/types/emailTypes.js';

/** Locale is passed from the frontend; backend email copy never imports Paraglide. */
export async function sendBookingRecoveryEmail(
	ctx: Parameters<typeof sendEmail>[0],
	{ email, url, locale }: BookingRecoveryEmailData
): Promise<void> {
	const copy = getTranslationLocale(locale, sendBookingRecoveryEmailTranslation);

	const { subject, heading, body } = copy;

	const minutes = BOOKINGS_CONFIG.RECOVERY_TOKEN_LIFETIME_MS / 60_000;

	const { COLORS, TYPOGRAPHY } = EMAIL_DATA;

	await sendEmail(ctx, {
		to: email,
		subject,
		previewText: heading,
		text: `${heading}\n\n${body.text(url, minutes)}`,
		content: `
			<h1 style="margin:0 0 16px;font-family:${TYPOGRAPHY.FONT_FAMILY};font-size:28px;line-height:36px;color:${COLORS.FOREGROUND};">${escapeHtml(heading)}</h1>
			${body.html(url, minutes)}
		`
	});
}
