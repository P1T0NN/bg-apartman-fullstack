// UTILS
import { escapeHtml } from '../../../shared/utils/escapeHtml.js';

// DATA
import { EMAIL_DATA } from '../data/emailData.js';

export const sendBookingRecoveryEmailTranslation = {
	en: {
		subject: 'Your secure booking link',
		heading: 'View your bookings',
		body: {
			text: (url: string, minutes: number) =>
				`You requested access to bookings made with this email address.

				This link grants access to your booking information. Do not share it.

				This link expires in ${minutes} minutes and can be reopened until it expires.

				Open the link to view your bookings automatically.

				${url}

				If you did not request this link, you can safely ignore this email. Your bookings remain unchanged.`,
			html: (url: string, minutes: number) => `
					<p>You requested access to bookings made with this email address.</p>
					<p><strong>This link grants access to your booking information. Do not share it.</strong></p>
					<p>This link expires in ${minutes} minutes and can be reopened until it expires.</p>
					<p>Open the link to view your bookings automatically.</p>
					<p style="margin:24px 0;"><a href="${escapeHtml(url)}" style="display:inline-block;padding:14px 28px;border-radius:8px;background-color:${EMAIL_DATA.COLORS.PRIMARY};color:${EMAIL_DATA.COLORS.PRIMARY_FOREGROUND};text-decoration:none;">View my bookings</a></p>
					<p style="overflow-wrap:anywhere;">${escapeHtml(url)}</p>
					<p style="font-size:13px;color:${EMAIL_DATA.COLORS.MUTED_FOREGROUND};">If you did not request this link, you can safely ignore this email. Your bookings remain unchanged.</p>
				`
		}
	}
};
