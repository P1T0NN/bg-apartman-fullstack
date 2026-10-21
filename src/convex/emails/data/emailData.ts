// CONFIG
import { COMPANY_DATA } from '../../../shared/config.js';

const PUBLIC_ORIGIN = process.env.PUBLIC_ORIGIN ?? `https://${COMPANY_DATA.DOMAIN}`;

export const EMAIL_DATA = {
	BRAND: {
		NAME: COMPANY_DATA.NAME,
		LOGO_URL: new URL('/logo/opt/logo-transparent-411w.webp', PUBLIC_ORIGIN).toString(),
		URL: PUBLIC_ORIGIN
	},
	COLORS: {
		// sRGB hex equivalents of src/routes/layout.css :root tokens for email clients.
		BACKGROUND: '#fdfcf8',
		FOREGROUND: '#110904',
		HEADER: '#17100b',
		HEADER_FOREGROUND: '#f2eee7',
		CARD: '#ffffff',
		CARD_FOREGROUND: '#110904',
		PRIMARY: '#e88100',
		PRIMARY_FOREGROUND: '#110904',
		SECONDARY: '#f5f1ea',
		SECONDARY_FOREGROUND: '#291f18',
		MUTED: '#f5f1ea',
		MUTED_FOREGROUND: '#6c6158',
		ACCENT: '#ef852e',
		ACCENT_FOREGROUND: '#110904',
		DESTRUCTIVE: '#df202e',
		DESTRUCTIVE_FOREGROUND: '#ffffff',
		BORDER: '#e1ddd7',
		INPUT: '#e1ddd7',
		RING: '#e88100'
	},
	TYPOGRAPHY: {
		FONT_FAMILY: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
		MONOSPACE: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
	},
	LAYOUT: {
		CONTENT_WIDTH: '600px',
		OUTER_PADDING: '24px',
		CARD_PADDING: '40px 32px',
		CARD_RADIUS: '12px'
	}
} as const;
