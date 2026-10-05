// LIBRARIES
import { expect, test } from 'vitest';

// SCHEMAS
import { timeZoneSchema } from '../src/shared/features/timezone/schemas/timezoneSchemas.js';

// UTILS
import { DAY_IN_MS } from '../src/shared/utils/date.js';
import { getIsoDateInTimeZone } from '../src/shared/features/timezone/utils/getIsoDateInTimeZone.js';
import { getZonedTimestamp } from '../src/shared/features/timezone/utils/getZonedTimestamp.js';
import { calculateBookingCancellationDeadlines } from '../src/shared/features/bookings/utils/calculateBookingCancellationDeadlines.js';
import { checkBookingCancellationRefund } from '../src/shared/features/bookings/utils/checkBookingCancellationRefund.js';

// TYPES
import type { BookingCancellationTerms } from '../src/shared/features/bookings/types/bookingTypes.js';

const terms: BookingCancellationTerms = {
	stayType: 'overnight',
	pricePerDayUseMinor: null,
	policy: {
		version: 1,
		mode: 'custom',
		fiveToSevenDays: 50,
		threeToFiveDays: 50,
		oneToThreeDays: 0,
		under24Hours: 0
	},
	timeZone: 'Europe/Belgrade',
	checkInStart: '14:00',
	checkInAt: getZonedTimestamp('2027-03-29', '14:00', 'Europe/Belgrade'),
	checkOut: '11:00',
	checkOutAt: getZonedTimestamp('2027-03-31', '11:00', 'Europe/Belgrade'),
	pricePerNightMinor: 8025,
	currency: 'EUR'
};

test('property timezones are validated and check-in instants follow property daylight-saving rules', () => {
	for (const timeZone of ['Europe/Belgrade', 'America/New_York', 'Asia/Kathmandu', 'UTC'])
		expect(timeZoneSchema.safeParse(timeZone).success).toBe(true);
	for (const timeZone of [undefined, '', 'Not/AZone', '+02:00', 'EST'])
		expect(timeZoneSchema.safeParse(timeZone).success).toBe(false);
	expect(timeZoneSchema.parse(' Europe/Belgrade ')).toBe('Europe/Belgrade');
	expect(getZonedTimestamp('2027-01-20', '14:00', 'Europe/Belgrade')).toBe(
		Date.parse('2027-01-20T13:00:00Z')
	);
	expect(getZonedTimestamp('2027-07-20', '14:00', 'Europe/Belgrade')).toBe(
		Date.parse('2027-07-20T12:00:00Z')
	);
	expect(getZonedTimestamp('2027-07-20', '14:00', 'Asia/Kathmandu')).toBe(
		Date.parse('2027-07-20T08:15:00Z')
	);
	expect(getIsoDateInTimeZone(Date.parse('2027-01-01T23:30:00Z'), 'Asia/Tokyo')).toBe('2027-01-02');
	expect(getIsoDateInTimeZone(Date.parse('2027-01-02T01:00:00Z'), 'America/Los_Angeles')).toBe(
		'2027-01-01'
	);
	// Spring gap and autumn fold must not silently move the agreed check-in time.
	expect(() => getZonedTimestamp('2027-03-28', '02:30', 'Europe/Belgrade')).toThrow();
	expect(() => getZonedTimestamp('2027-10-31', '02:30', 'Europe/Belgrade')).toThrow();
});

test('refund boundaries include the exact threshold and use elapsed hours across a clock change', () => {
	const deadlines = calculateBookingCancellationDeadlines(terms);
	expect(deadlines.sevenDaysOrMore).toBe(Date.parse('2027-03-22T12:00:00Z'));
	expect(terms.checkInAt - deadlines.sevenDaysOrMore).toBe(168 * 60 * 60 * 1000);
	for (const [days, percentage] of [
		[7, 100],
		[5, 50],
		[3, 50],
		[1, 0]
	] as const)
		expect(checkBookingCancellationRefund(terms, terms.checkInAt - days * DAY_IN_MS)).toBe(
			percentage
		);
	expect(checkBookingCancellationRefund(terms, deadlines.sevenDaysOrMore + 1)).toBe(50);
	expect(checkBookingCancellationRefund(terms, deadlines.threeToFiveDays + 1)).toBe(0);
	const otherSchedule: BookingCancellationTerms = {
		...terms,
		policy: {
			version: 1,
			mode: 'custom',
			fiveToSevenDays: 100,
			threeToFiveDays: 50,
			oneToThreeDays: 50,
			under24Hours: 0
		}
	};
	expect(checkBookingCancellationRefund(otherSchedule, deadlines.fiveToSevenDays)).toBe(100);
	expect(checkBookingCancellationRefund(otherSchedule, deadlines.fiveToSevenDays + 1)).toBe(50);
	expect(checkBookingCancellationRefund(otherSchedule, deadlines.oneToThreeDays)).toBe(50);
	expect(checkBookingCancellationRefund(otherSchedule, deadlines.oneToThreeDays + 1)).toBe(0);
	expect(checkBookingCancellationRefund(terms, terms.checkInAt - 1)).toBe(0);
	expect(checkBookingCancellationRefund(terms, terms.checkInAt)).toBeNull();
	expect(checkBookingCancellationRefund(terms, terms.checkInAt + 1)).toBeNull();
	const fullRefund: BookingCancellationTerms = {
		...terms,
		policy: { version: 1, mode: 'full_refund' }
	};
	expect(checkBookingCancellationRefund(fullRefund, fullRefund.checkInAt - 1)).toBe(100);
	expect(checkBookingCancellationRefund(fullRefund, fullRefund.checkInAt)).toBeNull();
});
