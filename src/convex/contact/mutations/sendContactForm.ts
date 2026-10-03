// LIBRARIES
import { MINUTE } from '@convex-dev/rate-limiter';
import { ConvexError, v } from 'convex/values';

// BUILDERS
import { action } from '../../builders/convexFunctionBuilders.js';

// CONFIG
import { COMPANY_DATA } from '../../../shared/config.js';

// EMAILS
import { EMAIL_DATA } from '../../emails/data/emailData.js';
import { sendEmail } from '../../emails/sendEmail.js';

// SCHEMAS
import { sendContactFormSchema } from '../../../shared/features/contact/schemas/contactSchemas.js';

// UTILS
import { escapeHtml } from '../../../shared/utils/escapeHtml.js';

// TYPES
import type { BackendErrorData } from '../../../shared/types/types.js';

/** Public contact form: validates the message and emails it to the platform inbox. */
export const sendContactForm = action({
	rateLimit: {
		name: 'contact:send',
		config: { kind: 'token bucket', rate: 30, period: MINUTE, capacity: 10 }
	},
	args: {
		name: v.string(),
		company: v.optional(v.string()),
		email: v.string(),
		message: v.string()
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const parsed = sendContactFormSchema.safeParse(args);
		if (!parsed.success) throw new ConvexError<BackendErrorData>({ code: 'INVALID_CONTACT_FORM' });

		const { name, company, email, message } = parsed.data;
		const { COLORS, TYPOGRAPHY } = EMAIL_DATA;

		const safeName = name.replace(/\s+/g, ' ');
		const rowStyle = `margin:0 0 8px;font-family:${TYPOGRAPHY.FONT_FAMILY};font-size:14px;line-height:22px;color:${COLORS.CARD_FOREGROUND};`;
		const companyRow = company
			? `<p style="${rowStyle}"><strong>Company:</strong> ${escapeHtml(company)}</p>`
			: '';
		const textLines = [
			`Name: ${safeName}`,
			...(company ? [`Company: ${company}`] : []),
			`Email: ${email}`,
			'',
			message
		];

		await sendEmail(ctx, {
			to: COMPANY_DATA.EMAIL,
			replyTo: email,
			subject: `New contact message from ${safeName}`,
			previewText: `${safeName} sent a message through the contact form.`,
			text: textLines.join('\n'),
			content: `
				<h1 style="margin:0 0 8px;font-family:${TYPOGRAPHY.FONT_FAMILY};font-size:24px;line-height:32px;color:${COLORS.FOREGROUND};">New contact message</h1>
				<p style="margin:0 0 20px;font-family:${TYPOGRAPHY.FONT_FAMILY};font-size:14px;line-height:22px;color:${COLORS.MUTED_FOREGROUND};">Sent from the website contact form.</p>
				<p style="${rowStyle}"><strong>Name:</strong> ${escapeHtml(safeName)}</p>
				${companyRow}
				<p style="${rowStyle}"><strong>Email:</strong> ${escapeHtml(email)}</p>
				<p style="margin:16px 0 0;font-family:${TYPOGRAPHY.FONT_FAMILY};font-size:14px;line-height:22px;white-space:pre-wrap;color:${COLORS.CARD_FOREGROUND};">${escapeHtml(message)}</p>
			`
		});

		return null;
	}
});
