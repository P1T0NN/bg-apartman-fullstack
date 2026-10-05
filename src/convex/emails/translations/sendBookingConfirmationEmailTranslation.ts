// UTILS
import { escapeHtml } from '../../../shared/utils/escapeHtml.js';

// DATA
import { EMAIL_DATA } from '../data/emailData.js';

// TYPES
import type { BookingConfirmationEmailBodyData } from '../types/emailTypes.js';

function introduction(data: BookingConfirmationEmailBodyData): string {
	if (data.host)
		return 'A guest booked your accommodation with Instant Booking. The stay is already confirmed; no approval is required. Review the stay details promptly and ensure the property and check-in arrangements are ready.';
	if (data.instant)
		return 'Your stay was confirmed immediately with Instant Booking. You do not need to wait for host approval. View the latest booking status and cancellation terms online.';
	return 'Your host has accepted your booking request. Your stay is now confirmed. View the latest booking status and cancellation terms online.';
}

export const sendBookingConfirmationEmailTranslation = {
	en: {
		subject: 'Your booking is confirmed',
		heading: 'Your booking is confirmed',
		instantSubject: 'Your Instant Booking is confirmed',
		instantHeading: 'Your Instant Booking is confirmed',
		hostSubject: 'New confirmed Instant Booking for your accommodation',
		hostHeading: 'You have a new confirmed booking',
		body: {
			text: (data: BookingConfirmationEmailBodyData) =>
				[
					introduction(data),
					`Accommodation: ${data.accommodationName || 'Unavailable accommodation'}`,
					`Guest: ${data.guestName}`,
					`Check-in (property local time): ${data.checkIn}`,
					`Check-out (property local time): ${data.checkOut}`,
					`Guests: ${data.adults} ${data.adults === 1 ? 'adult' : 'adults'}, ${data.children} ${data.children === 1 ? 'child' : 'children'}`,
					...(data.host ? [`Guest phone: ${data.phone}`] : []),
					...(data.specialRequests ? [`Special requests: ${data.specialRequests}`] : []),
					'No payment was collected when this booking was submitted.',
					`View booking status: ${data.url}`,
					...(data.host
						? []
						: [
								`For full booking details, use the same booking email to find your booking: ${data.findBookingUrl}`
							])
				].join('\n\n'),
			html: (data: BookingConfirmationEmailBodyData) => `
				<p>${escapeHtml(introduction(data))}</p>
				<p>Accommodation: ${escapeHtml(data.accommodationName || 'Unavailable accommodation')}</p>
				<p>Guest: ${escapeHtml(data.guestName)}</p>
				<p>Check-in (property local time): ${escapeHtml(data.checkIn)}</p>
				<p>Check-out (property local time): ${escapeHtml(data.checkOut)}</p>
				<p>Guests: ${data.adults} ${data.adults === 1 ? 'adult' : 'adults'}, ${data.children} ${data.children === 1 ? 'child' : 'children'}</p>
				${data.host ? `<p>Guest phone: ${escapeHtml(data.phone)}</p>` : ''}
				${data.specialRequests ? `<p style="white-space:pre-wrap;overflow-wrap:anywhere;">Special requests: ${escapeHtml(data.specialRequests)}</p>` : ''}
				<p>No payment was collected when this booking was submitted.</p>
				<p style="margin:24px 0;"><a href="${escapeHtml(data.url)}" style="display:inline-block;padding:14px 28px;border-radius:8px;background-color:${EMAIL_DATA.COLORS.PRIMARY};color:${EMAIL_DATA.COLORS.PRIMARY_FOREGROUND};text-decoration:none;">View booking status</a></p>
				<p style="overflow-wrap:anywhere;">${escapeHtml(data.url)}</p>
				${data.host ? '' : `<p>For full booking details, <a href="${escapeHtml(data.findBookingUrl)}">find your booking</a> using the same booking email.</p>`}
			`
		}
	}
};
