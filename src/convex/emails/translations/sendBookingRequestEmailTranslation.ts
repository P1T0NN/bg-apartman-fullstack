// UTILS
import { escapeHtml } from '../../../shared/utils/escapeHtml.js';

// DATA
import { EMAIL_DATA } from '../data/emailData.js';

// TYPES
import type { BookingRequestEmailBodyData } from '../types/emailTypes.js';

export const sendBookingRequestEmailTranslation = {
	en: {
		subject: {
			guest: 'Your booking request was received',
			host: 'New booking request for your accommodation'
		},
		heading: { guest: 'We received your booking request', host: 'You have a new booking request' },
		body: {
			text: (data: BookingRequestEmailBodyData) =>
				[
					data.recipient === 'guest'
						? 'Your request has been sent to the host. A request does not confirm your stay; the host must accept it. View the latest booking status online.'
						: 'A guest has requested a stay at your accommodation. Review the request and confirm or decline it in your host bookings.',
					`Accommodation: ${data.accommodationName}`,
					`Guest: ${data.guestName}`,
					`Check-in (property local time): ${data.checkIn}`,
					`Check-out (property local time): ${data.checkOut}`,
					`Guests: ${data.adults} ${data.adults === 1 ? 'adult' : 'adults'}, ${data.children} ${data.children === 1 ? 'child' : 'children'}`,
					...(data.recipient === 'host' ? [`Guest phone: ${data.phone}`] : []),
					...(data.specialRequests ? [`Special requests: ${data.specialRequests}`] : []),
					'No payment was collected when this request was submitted.',
					`${data.recipient === 'host' ? 'Review booking requests' : 'View booking status'}: ${data.url}`,
					...(data.recipient === 'guest'
						? [
								`If you booked without signing in, use the same booking email to find your booking: ${data.findBookingUrl}`
							]
						: [])
				].join('\n\n'),
			html: (data: BookingRequestEmailBodyData) => `
				<p>${
					data.recipient === 'guest'
						? 'Your request has been sent to the host. <strong>A request does not confirm your stay; the host must accept it.</strong> View the latest booking status online.'
						: 'A guest has requested a stay at your accommodation. Review the request and confirm or decline it in your host bookings.'
				}</p>
				<p>Accommodation: ${escapeHtml(data.accommodationName)}</p>
				<p>Guest: ${escapeHtml(data.guestName)}</p>
				<p>Check-in (property local time): ${escapeHtml(data.checkIn)}</p>
				<p>Check-out (property local time): ${escapeHtml(data.checkOut)}</p>
				<p>Guests: ${data.adults} ${data.adults === 1 ? 'adult' : 'adults'}, ${data.children} ${data.children === 1 ? 'child' : 'children'}</p>
				${data.recipient === 'host' ? `<p>Guest phone: ${escapeHtml(data.phone)}</p>` : ''}
				${data.specialRequests ? `<p style="white-space:pre-wrap;overflow-wrap:anywhere;">Special requests: ${escapeHtml(data.specialRequests)}</p>` : ''}
				<p>No payment was collected when this request was submitted.</p>
				<p style="margin:24px 0;"><a href="${escapeHtml(data.url)}" style="display:inline-block;padding:14px 28px;border-radius:8px;background-color:${EMAIL_DATA.COLORS.PRIMARY};color:${EMAIL_DATA.COLORS.PRIMARY_FOREGROUND};text-decoration:none;">${data.recipient === 'host' ? 'Review booking requests' : 'View booking status'}</a></p>
				<p style="overflow-wrap:anywhere;">${escapeHtml(data.url)}</p>
				${data.recipient === 'guest' ? `<p>If you booked without signing in, <a href="${escapeHtml(data.findBookingUrl)}">find your booking</a> using the same booking email.</p>` : ''}
			`
		}
	}
};
