// DATA
import { EMAIL_DATA } from '../data/emailData.js';

// UTILS
import { escapeHtml } from '../../../shared/utils/escapeHtml.js';

export function renderHeaderTemplate(): string {
	const { BRAND, COLORS, LAYOUT, TYPOGRAPHY } = EMAIL_DATA;
	const BRAND_CONTENT = BRAND.URL
		? `<a href="${escapeHtml(BRAND.URL)}" style="color:${COLORS.HEADER_FOREGROUND};text-decoration:none;">`
		: '<span style="color:' + COLORS.HEADER_FOREGROUND + ';">';
	const BRAND_CLOSE = BRAND.URL ? '</a>' : '</span>';

	return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLORS.HEADER};">
	<tr>
		<td align="center" style="padding:${LAYOUT.OUTER_PADDING};">
			<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:${LAYOUT.CONTENT_WIDTH};">
			<tr>
				<td style="font-family:${TYPOGRAPHY.FONT_FAMILY};font-size:18px;font-weight:700;line-height:24px;">
					${BRAND_CONTENT}
						<img src="${escapeHtml(BRAND.LOGO_URL)}" alt="" width="41" height="61" style="display:inline-block;width:41px;height:61px;margin-right:8px;border:0;vertical-align:middle;">
						<span style="vertical-align:middle;">${escapeHtml(BRAND.NAME)}</span>
					${BRAND_CLOSE}
				</td>
			</tr>
			</table>
		</td>
	</tr>
</table>`;
}
