import { expect, test } from 'vitest';
import { getReviewDeadline } from '../src/shared/features/reviews/utils/getReviewDeadline.js';
import { canReviewBooking } from '../src/shared/features/reviews/utils/canReviewBooking.js';
import { formatDateTime } from '../src/shared/utils/date.js';
import { getZonedTimestamp } from '../src/shared/features/timezone/utils/getZonedTimestamp.js';
import { bookingCancellationTerms } from './fixtures/bookingCancellationTerms.js';

test('review deadlines use 90 property calendar days, with the offset at the deadline date', () => {
	expect(getReviewDeadline('2026-07-02', 'Europe/Belgrade')).toBe(
		Date.parse('2026-09-29T22:00:00Z')
	);
	expect(getReviewDeadline('2027-01-01', 'Europe/Belgrade')).toBe(
		Date.parse('2027-03-31T22:00:00Z')
	);
	expect(getReviewDeadline('2027-01-01', 'America/New_York')).toBe(
		Date.parse('2027-04-01T04:00:00Z')
	);
	expect(getReviewDeadline('2027-01-01', 'Pacific/Kiritimati')).toBe(
		Date.parse('2027-03-31T10:00:00Z')
	);
	const timestamp = getZonedTimestamp('2027-04-01', '00:00', 'Europe/Belgrade');
	expect(formatDateTime(timestamp, 'en-GB', 'Europe/Belgrade')).toContain('00:00');
});

test('reviews open exactly at frozen checkout and close exactly at property-local deadline', () => {
	for (const timeZone of ['Europe/Belgrade', 'America/Los_Angeles', 'Pacific/Kiritimati']) {
		const booking = {
			status: 'completed',
			checkOutDate: '2027-03-28',
			cancellationTerms: bookingCancellationTerms('2027-03-26', '2027-03-28', timeZone)
		};
		const checkout = booking.cancellationTerms.checkOutAt;
		const deadline = getReviewDeadline(booking.checkOutDate, timeZone);
		expect(canReviewBooking(booking, checkout - 1)).toBe(false);
		expect(canReviewBooking(booking, checkout)).toBe(true);
		expect(canReviewBooking(booking, deadline - 1)).toBe(true);
		expect(canReviewBooking(booking, deadline)).toBe(false);
	}
});
