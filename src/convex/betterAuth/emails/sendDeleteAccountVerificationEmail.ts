// EMAILS
import { sendEmail } from '../../emails/sendEmail.js';

// CONFIG
import { COMPANY_DATA } from '../../../shared/config.js';

// DATA
import { EMAIL_DATA } from '../../emails/data/emailData.js';

// UTILS
import { escapeHtml } from '../../../shared/utils/escapeHtml.js';

// TYPES
import type { DeleteAccountEmailData } from '../../emails/types/emailTypes.js';

export async function sendDeleteAccountVerificationEmail(
	ctx: Parameters<typeof sendEmail>[0],
	{ email, name, url }: DeleteAccountEmailData
): Promise<void> {
	const { COLORS, TYPOGRAPHY } = EMAIL_DATA;
	const { EMAIL_COPY } = COMPANY_DATA;
	const heading = 'Confirm account deletion';
	const instruction = `Hi ${escapeHtml(name)}, you asked to delete your account. Opening the button below permanently deletes your account, saved stays and sign-in details. Bookings you already made stay on record for the host.`;

	await sendEmail(ctx, {
		to: email,
		subject: 'Confirm account deletion',
		previewText: 'Confirm that you want to delete your account.',
		text: `${heading}\n\n${instruction}\n\n${url}\n\n${EMAIL_COPY.IGNORE_NOTICE}`,
		content: `
			<h1 style="margin:0 0 16px;font-family:${TYPOGRAPHY.FONT_FAMILY};font-size:28px;line-height:36px;font-weight:700;color:${COLORS.FOREGROUND};">${heading}</h1>
			<p style="margin:0 0 24px;font-family:${TYPOGRAPHY.FONT_FAMILY};font-size:16px;line-height:24px;color:${COLORS.MUTED_FOREGROUND};">${instruction}</p>
			<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
				<tr>
					<td align="center" style="border-radius:8px;background-color:${COLORS.DESTRUCTIVE};">
						<a href="${escapeHtml(url)}" style="display:inline-block;padding:14px 28px;font-family:${TYPOGRAPHY.FONT_FAMILY};font-size:16px;line-height:20px;font-weight:600;color:${COLORS.PRIMARY_FOREGROUND};text-decoration:none;">Delete my account</a>
					</td>
				</tr>
			</table>
			<p style="margin:0;font-family:${TYPOGRAPHY.FONT_FAMILY};font-size:13px;line-height:20px;color:${COLORS.MUTED_FOREGROUND};">${EMAIL_COPY.IGNORE_NOTICE}</p>
		`
	});
}
