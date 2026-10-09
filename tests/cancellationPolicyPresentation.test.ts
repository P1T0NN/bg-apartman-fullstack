import { expect, test } from 'vitest';
import { ACCOMMODATION_CONFIG } from '../src/shared/features/accommodations/config.js';
import { displayCancellationPolicyPeriods } from '../src/shared/features/accommodations/utils/displayCancellationPolicyPeriods.js';
import { checkBookingCancellationRefund } from '../src/shared/features/bookings/utils/checkBookingCancellationRefund.js';
import { getZonedTimestamp } from '../src/shared/features/timezone/utils/getZonedTimestamp.js';
import { formatZonedDateTime } from '../src/shared/features/timezone/utils/formatZonedDateTime.js';
import { DAY_IN_MS } from '../src/shared/utils/date.js';
import type { CancellationPolicy } from '../src/shared/features/accommodations/types/cancellationPolicyTypes.js';

test('guest periods merge equal outcomes while preserving exact policy boundaries', () => {
	const checkInAt = getZonedTimestamp('2027-03-29', '14:00', 'Europe/Belgrade');
	const choices = ACCOMMODATION_CONFIG.CANCELLATION_REFUND_PERCENTAGES;
	for (const fiveToSevenDays of choices)
		for (const threeToFiveDays of choices)
			for (const oneToThreeDays of choices)
				for (const under24Hours of choices) {
					const decreasing =
						fiveToSevenDays >= threeToFiveDays &&
						threeToFiveDays >= oneToThreeDays &&
						oneToThreeDays >= under24Hours;
					if (!decreasing) continue;
					const policy: CancellationPolicy = {
						version: 1,
						mode: 'custom',
						fiveToSevenDays,
						threeToFiveDays,
						oneToThreeDays,
						under24Hours
					};
					const periods = displayCancellationPolicyPeriods(policy);
					expect(periods[0].afterHours).toBeNull();
					expect(periods.at(-1)?.untilHours).toBe(0);
					for (const [index, period] of periods.entries()) {
						if (index > 0) {
							expect(period.afterHours).toBe(periods[index - 1].untilHours);
							expect(period.percentage).not.toBe(periods[index - 1].percentage);
						}
					}
					for (const hours of [240, 168, 120, 72, 24, 0])
						for (const delta of [-1, 0, 1]) {
							const now = checkInAt - (hours * DAY_IN_MS) / 24 + delta;
							const displayed = periods.find((period) => {
								const afterStart =
									period.afterHours === null ||
									now > checkInAt - (period.afterHours * DAY_IN_MS) / 24;
								const beforeEnd =
									period.untilHours === 0
										? now < checkInAt
										: now <= checkInAt - (period.untilHours * DAY_IN_MS) / 24;
								return afterStart && beforeEnd;
							});
							expect(displayed?.percentage ?? null).toBe(
								checkBookingCancellationRefund({ policy, checkInAt }, now)
							);
						}
				}
});

test('previous full-refund schedules retain their original meaning', () => {
	const expected = [{ percentage: 100, afterHours: null, untilHours: 0 }];
	expect(displayCancellationPolicyPeriods({ version: 1, mode: 'full_refund' })).toEqual(expected);
	expect(
		displayCancellationPolicyPeriods({
			version: 1,
			mode: 'custom',
			fiveToSevenDays: 100,
			threeToFiveDays: 100,
			oneToThreeDays: 100,
			under24Hours: 100
		})
	).toEqual(expected);
});

test('a last-minute stay has its reduced refund immediately, with no new free-cancellation period', () => {
	const policy: CancellationPolicy = {
		version: 1,
		mode: 'custom',
		fiveToSevenDays: 50,
		threeToFiveDays: 50,
		oneToThreeDays: 0,
		under24Hours: 0
	};
	expect(displayCancellationPolicyPeriods(policy)).toEqual([
		{ percentage: 100, afterHours: null, untilHours: 168 },
		{ percentage: 50, afterHours: 168, untilHours: 72 },
		{ percentage: 0, afterHours: 72, untilHours: 0 }
	]);
	const now = Date.parse('2027-01-01T10:00:00Z');
	expect(checkBookingCancellationRefund({ policy, checkInAt: now + DAY_IN_MS / 2 }, now)).toBe(0);
});

test('deadline formatting uses its own DST offset and supports quarter-hour zones', () => {
	const before = formatZonedDateTime(Date.parse('2027-03-22T12:00:00Z'), 'en', 'Europe/Belgrade');
	const after = formatZonedDateTime(Date.parse('2027-03-29T12:00:00Z'), 'en', 'Europe/Belgrade');
	expect(before).toContain('13:00');
	expect(before).toContain('GMT+01:00');
	expect(after).toContain('14:00');
	expect(after).toContain('GMT+02:00');
	expect(formatZonedDateTime(Date.parse('2027-07-20T08:15:00Z'), 'en', 'Asia/Kathmandu')).toContain(
		'GMT+05:45'
	);
});
