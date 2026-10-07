// LIBRARIES
import { expect, test } from 'vitest';

// UTILS
import { calculateBookingPlatformFee } from '../../src/shared/features/bookings/utils/calculateBookingPlatformFee.js';

// FIXTURES
import { bookingFeeBilling } from '../fixtures/accommodationBilling.js';

test('platform fees round once, preserve overrides and resolve free and paid periods at booking time', () => {
	const now = 1000;
	expect(calculateBookingPlatformFee(bookingFeeBilling, 10005, 'EUR', now)).toEqual({
		model: 'booking_fee',
		commissionBps: 1000,
		baseAmountMinor: 10005,
		amountMinor: 1001,
		currency: 'EUR'
	});
	expect(calculateBookingPlatformFee(bookingFeeBilling, 10004, 'EUR', now).amountMinor).toBe(1000);
	expect(
		calculateBookingPlatformFee(bookingFeeBilling, Number.MAX_SAFE_INTEGER, 'EUR', now).amountMinor
	).toBe(900719925474099);
	for (const commissionBps of [0, 1250, 10000]) {
		const terms = {
			...bookingFeeBilling,
			billingTerms: { model: 'booking_fee' as const, commissionBps }
		};
		expect(calculateBookingPlatformFee(terms, 10000, 'EUR', now).amountMinor).toBe(commissionBps);
	}
	const free = {
		...bookingFeeBilling,
		billingPlanId: 'free' as const,
		billingTerms: { model: 'free' as const }
	};
	expect(calculateBookingPlatformFee(free, 10000, 'EUR', now)).toMatchObject({
		model: 'free',
		amountMinor: 0
	});
	expect(
		calculateBookingPlatformFee({ ...free, billingPeriodEndsAt: now + 1 }, 10000, 'EUR', now)
			.amountMinor
	).toBe(0);
	expect(
		calculateBookingPlatformFee({ ...free, billingPeriodEndsAt: now }, 10000, 'EUR', now)
	).toMatchObject({ model: 'booking_fee', commissionBps: 1000, amountMinor: 1000 });
	const flat = {
		...bookingFeeBilling,
		billingPlanId: 'flat_fee' as const,
		billingTerms: {
			model: 'flat_fee' as const,
			amountMinor: 30000,
			currency: 'EUR',
			intervalMonths: 3
		},
		billingPeriodEndsAt: now + 1
	};
	expect(calculateBookingPlatformFee(flat, 10000, 'EUR', now)).toMatchObject({
		model: 'flat_fee',
		commissionBps: 0,
		amountMinor: 0
	});
	expect(() =>
		calculateBookingPlatformFee({ ...flat, billingPeriodEndsAt: now }, 10000, 'EUR', now)
	).toThrow();
	expect(() =>
		calculateBookingPlatformFee({ ...flat, billingPeriodEndsAt: null }, 10000, 'EUR', now)
	).toThrow();
	for (const base of [0, -1, 1.5, Number.NaN, Number.MAX_SAFE_INTEGER + 1])
		expect(() => calculateBookingPlatformFee(bookingFeeBilling, base, 'EUR', now)).toThrow();
	for (const commissionBps of [-1, 10001, 0.5, Number.NaN])
		expect(() =>
			calculateBookingPlatformFee(
				{ ...bookingFeeBilling, billingTerms: { model: 'booking_fee', commissionBps } },
				10000,
				'EUR',
				now
			)
		).toThrow();
	expect(() =>
		calculateBookingPlatformFee(
			{ ...bookingFeeBilling, billingStatus: 'pending_payment' },
			10000,
			'EUR',
			now
		)
	).toThrow();
});
