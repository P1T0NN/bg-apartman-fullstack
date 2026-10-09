import { expect, test } from 'vitest';
import { ACCOMMODATION_CONFIG } from '../src/shared/features/accommodations/config.js';
import { cancellationPolicySchema } from '../src/shared/features/accommodations/schemas/cancellationPolicySchemas.js';
import { getMatchingCancellationPreset } from '../src/shared/features/accommodations/utils/getMatchingCancellationPreset.js';
import { displayCancellationPolicyPeriods } from '../src/shared/features/accommodations/utils/displayCancellationPolicyPeriods.js';
import { checkBookingCancellationRefund } from '../src/shared/features/bookings/utils/checkBookingCancellationRefund.js';
import { calculateBookingRefundAmount } from '../src/shared/features/bookings/utils/calculateBookingRefundAmount.js';
import { getZonedTimestamp } from '../src/shared/features/timezone/utils/getZonedTimestamp.js';

test('each preset has one inclusive full-refund cutoff and no grace period for last-minute bookings', () => {
	const checkInAt = getZonedTimestamp('2027-03-29', '14:00', 'Europe/Belgrade');
	for (const mode of ACCOMMODATION_CONFIG.CANCELLATION_POLICY_MODES) {
		const policy = cancellationPolicySchema.parse({ version: 1, mode });
		const hours = ACCOMMODATION_CONFIG.CANCELLATION_POLICY_HOURS[mode];
		const refundDeadlineAt = checkInAt - hours * 60 * 60 * 1000;
		const terms = { policy, checkInAt, refundDeadlineAt };
		expect(checkBookingCancellationRefund(terms, refundDeadlineAt - 1)).toBe(100);
		expect(checkBookingCancellationRefund(terms, refundDeadlineAt)).toBe(100);
		expect(checkBookingCancellationRefund(terms, refundDeadlineAt + 1)).toBe(0);
		expect(checkBookingCancellationRefund(terms, checkInAt - 1)).toBe(0);
		expect(checkBookingCancellationRefund(terms, checkInAt)).toBeNull();
		expect(displayCancellationPolicyPeriods(policy)).toEqual([
			{ percentage: 100, afterHours: null, untilHours: hours },
			{ percentage: 0, afterHours: hours, untilHours: 0 }
		]);
	}
});

test('frozen deadlines remain authoritative and elapsed hours cross DST without shifting', () => {
	const checkInAt = getZonedTimestamp('2027-03-29', '14:00', 'Europe/Belgrade');
	const refundDeadlineAt = checkInAt - 168 * 60 * 60 * 1000;
	expect(refundDeadlineAt).toBe(Date.parse('2027-03-22T12:00:00Z'));
	const terms = { policy: { version: 1, mode: 'flexible' } as const, checkInAt, refundDeadlineAt };
	expect(checkBookingCancellationRefund(terms, refundDeadlineAt)).toBe(100);
	expect(checkBookingCancellationRefund(terms, refundDeadlineAt + 1)).toBe(0);
});

test('mapping changes only mathematically identical schedules', () => {
	const base = {
		version: 1,
		mode: 'custom',
		fiveToSevenDays: 100,
		threeToFiveDays: 100,
		oneToThreeDays: 100,
		under24Hours: 0
	} as const;
	expect(getMatchingCancellationPreset(base)).toEqual({ version: 1, mode: 'flexible' });
	expect(getMatchingCancellationPreset({ ...base, threeToFiveDays: 0, oneToThreeDays: 0 })).toEqual(
		{ version: 1, mode: 'moderate' }
	);
	expect(
		getMatchingCancellationPreset({
			...base,
			fiveToSevenDays: 0,
			threeToFiveDays: 0,
			oneToThreeDays: 0
		})
	).toEqual({ version: 1, mode: 'firm' });
	expect(getMatchingCancellationPreset({ ...base, oneToThreeDays: 50 })).toBeNull();
	expect(getMatchingCancellationPreset({ ...base, oneToThreeDays: 0 })).toBeNull();
	expect(getMatchingCancellationPreset({ ...base, under24Hours: 100 })).toBeNull();
	expect(getMatchingCancellationPreset({ version: 1, mode: 'full_refund' })).toBeNull();
});

test('refund amounts preserve every cent and round previous half refunds only once', () => {
	expect(calculateBookingRefundAmount(24000, 100)).toBe(24000);
	expect(calculateBookingRefundAmount(24000, 0)).toBe(0);
	expect(calculateBookingRefundAmount(8025, 50)).toBe(4013);
	expect(calculateBookingRefundAmount(Number.MAX_SAFE_INTEGER, 100)).toBe(Number.MAX_SAFE_INTEGER);
	for (const amount of [-1, 1.1, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])
		expect(() => calculateBookingRefundAmount(amount, 100)).toThrow();
});
