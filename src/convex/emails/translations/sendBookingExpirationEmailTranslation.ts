// UTILS
import { escapeHtml } from '../../../shared/utils/escapeHtml.js';

// DATA
import { EMAIL_DATA } from '../data/emailData.js';

// TYPES
import type { BookingGuestEmailBodyData } from '../types/emailTypes.js';

export const sendBookingExpirationEmailTranslation = {
	en: {
		subject: 'Your booking request expired',
		heading: 'Your booking request expired',
		body: {
			text: (data: BookingGuestEmailBodyData) =>
				[
					'Your host did not accept or decline before the response deadline. Your request has expired and this stay is not booked. You can submit a new request, subject to current availability.',
					`Accommodation: ${data.accommodationName || 'Unavailable accommodation'}`,
					`Guest: ${data.guestName}`,
					`Check-in (property local time): ${data.checkIn}`,
					`Check-out (property local time): ${data.checkOut}`,
					`Guests: ${data.adults} ${data.adults === 1 ? 'adult' : 'adults'}, ${data.children} ${data.children === 1 ? 'child' : 'children'}`,
					'No payment was collected when your booking request was submitted.',
					`View booking status: ${data.url}`,
					`For full booking details, use the same booking email to find your booking: ${data.findBookingUrl}`
				].join('\n\n'),
			html: (data: BookingGuestEmailBodyData) => `
				<p>Your host did not accept or decline before the response deadline. <strong>Your request has expired and this stay is not booked.</strong> You can submit a new request, subject to current availability.</p>
				<p>Accommodation: ${escapeHtml(data.accommodationName || 'Unavailable accommodation')}</p>
				<p>Guest: ${escapeHtml(data.guestName)}</p>
				<p>Check-in (property local time): ${escapeHtml(data.checkIn)}</p>
				<p>Check-out (property local time): ${escapeHtml(data.checkOut)}</p>
				<p>Guests: ${data.adults} ${data.adults === 1 ? 'adult' : 'adults'}, ${data.children} ${data.children === 1 ? 'child' : 'children'}</p>
				<p>No payment was collected when your booking request was submitted.</p>
				<p style="margin:24px 0;"><a href="${escapeHtml(data.url)}" style="display:inline-block;padding:14px 28px;border-radius:8px;background-color:${EMAIL_DATA.COLORS.PRIMARY};color:${EMAIL_DATA.COLORS.PRIMARY_FOREGROUND};text-decoration:none;">View booking status</a></p>
				<p style="overflow-wrap:anywhere;">${escapeHtml(data.url)}</p>
				<p>For full booking details, <a href="${escapeHtml(data.findBookingUrl)}">find your booking</a> using the same booking email.</p>
			`
		}
	}
};
