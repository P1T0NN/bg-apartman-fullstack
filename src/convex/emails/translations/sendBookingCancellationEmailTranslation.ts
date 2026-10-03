// UTILS
import { escapeHtml } from '../../../shared/utils/escapeHtml.js';

// DATA
import { EMAIL_DATA } from '../data/emailData.js';

// TYPES
import type { BookingCancellationEmailBodyData } from '../types/emailTypes.js';

export const sendBookingCancellationEmailTranslation = {
	en: {
		subject: {
			withdrawal: {
				guest: 'Your booking request was withdrawn',
				host: 'A guest withdrew their booking request'
			},
			cancellation: {
				guest: 'Your booking was cancelled',
				host: 'A guest cancelled their booking'
			}
		},
		heading: {
			withdrawal: {
				guest: 'Your booking request was withdrawn',
				host: 'A guest withdrew their booking request'
			},
			cancellation: {
				guest: 'Your booking was cancelled',
				host: 'A guest cancelled their booking'
			}
		},
		body: {
			text: (data: BookingCancellationEmailBodyData) =>
				[
					`Accommodation: ${data.accommodationName || 'Unavailable accommodation'}`,
					`Guest: ${data.guestName}`,
					`Scheduled check-in (property local time): ${data.checkIn}`,
					data.cancellation.refundPercentage === null
						? 'This was a pending request. It was withdrawn without a cancellation charge.'
						: `Refund under the accepted policy: ${data.cancellation.refundPercentage}%.`,
					'No payment was collected. There is no payment to refund.',
					...(data.cancellation.kind === 'cancellation'
						? ['This cancellation has taken effect. Host approval is not required.']
						: []),
					`Reason provided by the guest: ${data.cancellation.reason}`,
					`${data.recipient === 'host' ? 'View host bookings' : 'View my bookings'}: ${data.url}`
				].join('\n\n'),
			html: (data: BookingCancellationEmailBodyData) => `
				<p>Accommodation: ${escapeHtml(data.accommodationName || 'Unavailable accommodation')}</p>
				<p>Guest: ${escapeHtml(data.guestName)}</p>
				<p>Scheduled check-in (property local time): ${escapeHtml(data.checkIn)}</p>
				<p>${
					data.cancellation.refundPercentage === null
						? 'This was a pending request. It was withdrawn without a cancellation charge.'
						: `Refund under the accepted policy: ${data.cancellation.refundPercentage}%.`
				}</p>
				<p>No payment was collected. There is no payment to refund.</p>
				${
					data.cancellation.kind === 'cancellation'
						? '<p>This cancellation has taken effect. Host approval is not required.</p>'
						: ''
				}
				<p style="white-space:pre-wrap;overflow-wrap:anywhere;">Reason provided by the guest: ${escapeHtml(data.cancellation.reason)}</p>
				<p style="margin:24px 0;"><a href="${escapeHtml(data.url)}" style="display:inline-block;padding:14px 28px;border-radius:8px;background-color:${EMAIL_DATA.COLORS.PRIMARY};color:${EMAIL_DATA.COLORS.PRIMARY_FOREGROUND};text-decoration:none;">${data.recipient === 'host' ? 'View host bookings' : 'View my bookings'}</a></p>
				<p style="overflow-wrap:anywhere;">${escapeHtml(data.url)}</p>
			`
		}
	}
};
