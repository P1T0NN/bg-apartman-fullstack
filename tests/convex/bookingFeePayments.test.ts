/// <reference types="vite/client" />

// LIBRARIES
import aggregateTest from '@convex-dev/aggregate/test';
import rateLimiterTest from '@convex-dev/rate-limiter/test';
import { convexTest } from 'convex-test';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

// CONVEX
import { api, internal } from '../../src/convex/_generated/api.js';
import schema from '../../src/convex/schema.js';

// HELPERS
import { syncBookingFeePayment } from '../../src/convex/tables/bookingFeePayments/helpers/syncBookingFeePayment.js';
import { syncHostBookingAggregate } from '../../src/convex/tables/bookings/helpers/syncHostBookingAggregate.js';
import { syncFlatFeeRevenueAggregate } from '../../src/convex/tables/accommodationFeePayments/helpers/syncFlatFeeRevenueAggregate.js';

// AGGREGATES
import { bookingAdminAggregate } from '../../src/convex/tables/bookings/aggregates/bookingAdminAggregate.js';

// FIXTURES
import { bookingCancellationTerms } from '../fixtures/bookingCancellationTerms.js';

// TYPES
import type { Doc } from '../../src/convex/_generated/dataModel.js';

const modules = import.meta.glob('../../src/convex/**/*.ts');
const hostDashboard = api.tables.bookings.queries.fetchHostDashboard.fetchHostDashboard;
const adminDashboard =
	api.tables.accommodationFeePayments.queries.fetchAdminDashboard.fetchAdminDashboard;
const adminSeries =
	api.tables.accommodationFeePayments.queries.fetchAdminRevenueSeries.fetchAdminRevenueSeries;
const apply =
	internal.tables.bookingFeePayments.mutations.applyBookingFeePayment.applyBookingFeePayment;
const updateStatus = api.tables.bookings.mutations.updateBookingStatus.updateBookingStatus;
const range = { from: Date.UTC(2026, 9, 19), to: Date.UTC(2026, 9, 19, 23, 59, 59, 999) };

beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(new Date('2026-10-19T12:00:00Z'));
});
afterEach(() => vi.useRealTimers());

async function setup() {
	const t = convexTest(schema, modules);
	for (const name of [
		'accommodationOwnerAggregate',
		'bookingHostAggregate',
		'bookingAdminAggregate',
		'flatFeeRevenueAggregate',
		'bookingFeeDueAggregate',
		'bookingFeePendingAggregate',
		'bookingFeePaidAggregate',
		'bookingFeeRevenueAggregate'
	])
		aggregateTest.register(t, name);
	rateLimiterTest.register(t);
	await t.mutation(internal.seed.seedAccommodations, { ownerId: 'host', count: 1 });
	const accommodation = await t.run((ctx) => ctx.db.query('accommodations').first());
	if (!accommodation) throw new Error('Missing accommodation');
	const accommodationId = accommodation._id;
	async function booking(overrides: Partial<Doc<'bookings'>> = {}) {
		return t.run(async (ctx) => {
			const cancellationTerms = bookingCancellationTerms('2026-10-16', '2026-10-18');
			const id = await ctx.db.insert('bookings', {
				accommodationId,
				hostId: 'host',
				status: 'confirmed',
				paymentMethod: 'online',
				loyaltyStatus: 'ineligible',
				platformFeeTerms: {
					model: 'booking_fee',
					commissionBps: 1000,
					baseAmountMinor: 20000,
					amountMinor: 2000,
					currency: 'EUR'
				},
				cancellationTerms: {
					...cancellationTerms,
					stayPricing: { ...cancellationTerms.stayPricing, totalMinor: 20000 }
				},
				firstName: 'Guest',
				lastName: 'Test',
				email: 'guest@example.invalid',
				phone: '+381600000000',
				checkInDate: '2026-10-16',
				checkOutDate: '2026-10-18',
				adults: 1,
				children: 0,
				...overrides
			});
			const stored = await ctx.db.get('bookings', id);
			if (!stored) throw new Error('Missing booking');
			await syncHostBookingAggregate(ctx, stored);
			await bookingAdminAggregate.insert(ctx, stored);
			return id;
		});
	}
	async function fee(bookingId: Doc<'bookings'>['_id']) {
		const result = await t.run((ctx) =>
			ctx.db
				.query('bookingFeePayments')
				.withIndex('by_booking_id', (q) => q.eq('bookingId', bookingId))
				.unique()
		);
		if (!result) throw new Error('Missing fee');
		return result;
	}
	return {
		t,
		booking,
		fee,
		accommodationId,
		host: t.withIdentity({ subject: 'host' }),
		admin: t.withIdentity({ subject: 'admin', role: 'admin' })
	};
}

test('online splits await verification without creating cash debts or earnings on completion', async () => {
	const { t, host, admin, booking, fee, accommodationId } = await setup();
	const cash = await booking({ paymentMethod: 'cash' });
	const online = await booking({ paymentMethod: 'online' });
	expect((await host.query(hostDashboard, range)).bookingFeesPending).toBe(2000);
	await t.run((ctx) =>
		ctx.db.patch('accommodations', accommodationId, {
			billingPlanId: 'flat_fee',
			billingTerms: { model: 'flat_fee', amountMinor: 30000, currency: 'EUR', intervalMonths: 3 }
		})
	);
	for (const id of [cash, online]) {
		await host.mutation(updateStatus, { id, status: 'completed' });
		await t.run(async (ctx) => {
			const stored = await ctx.db.get('bookings', id);
			if (stored) await syncBookingFeePayment(ctx, stored);
		});
		if (id === online)
			expect(await fee(id)).toMatchObject({ amountMinor: 2000, refundedAmountMinor: 0 });
	}
	expect(await t.run((ctx) => ctx.db.query('bookingFeePayments').collect())).toHaveLength(1);
	expect((await host.query(hostDashboard, range)).current).toMatchObject({
		revenue: 40000,
		bookingFeesPaid: 0
	});
	expect((await host.query(hostDashboard, range)).bookingFeesPending).toBe(2000);
	expect((await admin.query(adminDashboard, range)).current).toMatchObject({
		revenue: 0,
		bookingFeeRevenue: 0
	});
	await expect(host.mutation(updateStatus, { id: cash, status: 'completed' })).rejects.toThrow(
		'INVALID_BOOKING_STATUS'
	);
});

test('unaccepted, exempt and unknown historical terms create no payment allocation', async () => {
	const { t, host, booking } = await setup();
	for (const status of ['pending', 'declined', 'expired', 'cancelled'] as const) {
		const id = await booking({ status });
		await t.run(async (ctx) => {
			const stored = await ctx.db.get('bookings', id);
			if (stored) await syncBookingFeePayment(ctx, stored);
		});
	}
	for (const platformFeeTerms of [
		null,
		...(['flat_fee', 'free', 'booking_fee'] as const).map((model) => ({
			model,
			commissionBps: 0,
			baseAmountMinor: 20000,
			amountMinor: 0,
			currency: 'EUR'
		}))
	]) {
		const id = await booking({ platformFeeTerms });
		await host.mutation(updateStatus, { id, status: 'completed' });
	}
	expect(await t.run((ctx) => ctx.db.query('bookingFeePayments').collect())).toEqual([]);
	expect((await host.query(hostDashboard, range)).bookingFeesPending).toBe(0);
});

test('collection and cumulative refunds reconcile both dashboards and chart without double counting', async () => {
	const { t, host, admin, booking, fee } = await setup();
	const id = await booking();
	await host.mutation(updateStatus, { id, status: 'completed' });
	const receipt = await fee(id);
	const args = {
		bookingId: receipt.bookingId,
		grossAmountMinor: 20000,
		hostAmountMinor: 18000,
		provider: 'test-provider',
		providerPaymentId: 'capture-1',
		amountMinor: 2000,
		currency: 'EUR',
		refundedAmountMinor: 0,
		paidAt: Date.now()
	};
	const storedBooking = await t.run((ctx) => ctx.db.get('bookings', id));
	await t.mutation(apply, args);
	await t.mutation(apply, args);
	expect((await host.query(hostDashboard, range)).current).toMatchObject({
		revenue: 20000,
		bookingFeesPaid: 2000
	});
	expect((await host.query(hostDashboard, range)).bookingFeesPending).toBe(0);
	expect((await admin.query(adminDashboard, range)).current).toMatchObject({
		revenue: 2000,
		flatFeeRevenue: 0,
		bookingFeeRevenue: 2000
	});
	const paidAt = (await fee(id)).paidAt;
	vi.setSystemTime(new Date('2026-10-20T12:00:00Z'));
	await t.mutation(apply, { ...args, refundedAmountMinor: 500 });
	await t.mutation(apply, { ...args, refundedAmountMinor: 100 });
	await t.mutation(apply, args);
	expect((await fee(id)).paidAt).toBe(paidAt);
	expect((await host.query(hostDashboard, range)).current.bookingFeesPaid).toBe(1500);
	expect((await admin.query(adminDashboard, range)).current.revenue).toBe(1500);
	expect(await admin.query(adminSeries, range)).toEqual([{ date: range.from, revenue: 1500 }]);
	await t.mutation(apply, { ...args, refundedAmountMinor: 2000 });
	expect(await host.query(hostDashboard, range)).toMatchObject({
		bookingFeesPending: 0,
		current: { bookingFeesPaid: 0 }
	});
	expect((await admin.query(adminDashboard, range)).current.revenue).toBe(0);
	expect(await t.run((ctx) => ctx.db.get('bookings', id))).toEqual(storedBooking);
});

test('pending allocations include older bookings, collection uses payment date, and host/currency stay isolated', async () => {
	const { t, host, admin, booking, fee } = await setup();
	const first = await booking();
	await host.mutation(updateStatus, { id: first, status: 'completed' });
	const second = await booking();
	await host.mutation(updateStatus, { id: second, status: 'completed' });
	const other = await booking({ hostId: 'other-host' });
	await t
		.withIdentity({ subject: 'other-host' })
		.mutation(updateStatus, { id: other, status: 'completed' });
	const usd = await booking({
		cancellationTerms: {
			...bookingCancellationTerms('2026-10-16', '2026-10-18'),
			currency: 'USD',
			stayPricing: {
				regularNights: 2,
				weekendNights: 0,
				weekendBasePricePerNightMinor: null,
				weekendPricePerNightMinor: null,
				totalMinor: 90000
			}
		},
		platformFeeTerms: {
			model: 'booking_fee',
			commissionBps: 1000,
			baseAmountMinor: 90000,
			amountMinor: 9000,
			currency: 'USD'
		}
	});
	await host.mutation(updateStatus, { id: usd, status: 'completed' });
	vi.setSystemTime(new Date('2026-10-20T12:00:00Z'));
	for (const id of [first, other, usd]) {
		const receipt = await fee(id);
		await t.mutation(apply, {
			bookingId: receipt.bookingId,
			grossAmountMinor: id === usd ? 90000 : 20000,
			hostAmountMinor: id === usd ? 81000 : 18000,
			provider: 'test-provider',
			providerPaymentId: `capture-${id}`,
			amountMinor: receipt.amountMinor,
			currency: receipt.currency,
			refundedAmountMinor: 0,
			paidAt: Date.now()
		});
	}
	const nextRange = { from: range.from + 86400000, to: range.to + 86400000 };
	expect((await host.query(hostDashboard, nextRange)).current).toMatchObject({
		bookings: 0,
		revenue: 0,
		bookingFeesPaid: 2000
	});
	expect((await host.query(hostDashboard, nextRange)).bookingFeesPending).toBe(2000);
	expect((await admin.query(adminDashboard, range)).current.bookingFeeRevenue).toBe(0);
	expect((await admin.query(adminDashboard, nextRange)).current.bookingFeeRevenue).toBe(4000);
	expect(
		await t.withIdentity({ subject: 'stranger' }).query(hostDashboard, nextRange)
	).toMatchObject({ bookingFeesPending: 0, current: { bookingFeesPaid: 0 } });
});

test('rejects invalid amounts, mismatched currency and reused payment identifiers without changing balances', async () => {
	const { t, host, booking, fee } = await setup();
	const id = await booking();
	await host.mutation(updateStatus, { id, status: 'completed' });
	const receipt = await fee(id);
	const args = {
		bookingId: receipt.bookingId,
		grossAmountMinor: 20000,
		hostAmountMinor: 18000,
		provider: 'test-provider',
		providerPaymentId: 'capture-1',
		amountMinor: 2000,
		currency: 'EUR',
		refundedAmountMinor: 0,
		paidAt: Date.now()
	};
	for (const invalid of [
		{ amountMinor: 1999 },
		{ amountMinor: Number.NaN },
		{ grossAmountMinor: 19999 },
		{ hostAmountMinor: 19000 },
		{ hostAmountMinor: -1 },
		{ currency: 'USD' },
		{ refundedAmountMinor: -1 },
		{ refundedAmountMinor: 2001 },
		{ refundedAmountMinor: 0.5 },
		{ provider: '' },
		{ providerPaymentId: ' ' },
		{ paidAt: Date.now() + 1 },
		{ paidAt: -1 },
		{ paidAt: Number.NaN }
	])
		await expect(t.mutation(apply, { ...args, ...invalid })).rejects.toThrow(
			'Invalid booking fee payment'
		);
	expect((await host.query(hostDashboard, range)).bookingFeesPending).toBe(2000);
	await t.mutation(apply, args);
	await expect(t.mutation(apply, { ...args, providerPaymentId: 'different' })).rejects.toThrow(
		'already paid'
	);
	const second = await booking();
	await host.mutation(updateStatus, { id: second, status: 'completed' });
	await expect(t.mutation(apply, { ...args, bookingId: second })).rejects.toThrow(
		'already assigned'
	);
	expect(await host.query(hostDashboard, range)).toMatchObject({
		bookingFeesPending: 2000,
		current: { bookingFeesPaid: 2000 }
	});
});

test('fee validation failures roll back completion, and unauthorized hosts cannot complete another stay', async () => {
	const { t, host, booking } = await setup();
	const id = await booking({
		status: 'pending',
		platformFeeTerms: {
			model: 'booking_fee',
			commissionBps: 1000,
			baseAmountMinor: 20000,
			amountMinor: 2000.5,
			currency: 'EUR'
		}
	});
	await t.run((ctx) => ctx.db.patch('bookings', id, { status: 'confirmed' }));
	await expect(
		t.withIdentity({ subject: 'other-host' }).mutation(updateStatus, { id, status: 'completed' })
	).rejects.toThrow('BOOKING_NOT_FOUND');
	await expect(host.mutation(updateStatus, { id, status: 'completed' })).rejects.toThrow(
		'Invalid frozen booking fee'
	);
	expect((await t.run((ctx) => ctx.db.get('bookings', id)))?.status).toBe('confirmed');
	expect(await t.run((ctx) => ctx.db.query('bookingFeePayments').collect())).toEqual([]);
});

test('admin total and daily chart add flat-fee and booking-fee collections without mixing host stay value', async () => {
	const { t, host, admin, booking, accommodationId } = await setup();
	const id = await booking();
	await host.mutation(updateStatus, { id, status: 'completed' });
	await t.mutation(apply, {
		bookingId: id,
		grossAmountMinor: 20000,
		hostAmountMinor: 18000,
		provider: 'test-provider',
		providerPaymentId: 'booking-payment',
		amountMinor: 2000,
		currency: 'EUR',
		paidAt: Date.now(),
		refundedAmountMinor: 0
	});
	await t.run(async (ctx) => {
		const paymentId = await ctx.db.insert('accommodationFeePayments', {
			accommodationId,
			ownerId: 'host',
			provider: 'test-provider',
			terms: { amountMinor: 30000, currency: 'EUR', intervalMonths: 3 },
			status: 'paid',
			createdAt: Date.now(),
			expiresAt: Date.now(),
			paidAt: Date.now(),
			entitlementApplied: true,
			invalidated: false,
			refundedAmountMinor: 0,
			updatedAt: Date.now()
		});
		const receipt = await ctx.db.get('accommodationFeePayments', paymentId);
		if (receipt) await syncFlatFeeRevenueAggregate(ctx, receipt);
	});
	expect((await admin.query(adminDashboard, range)).current).toMatchObject({
		revenue: 32000,
		flatFeeRevenue: 30000,
		bookingFeeRevenue: 2000
	});
	expect(await admin.query(adminSeries, range)).toEqual([{ date: range.from, revenue: 32000 }]);
	expect((await host.query(hostDashboard, range)).current).toMatchObject({
		revenue: 20000,
		bookingFeesPaid: 2000
	});
});

test('verified online capture records the full split before stay completion, without a previous fee row', async () => {
	const { t, admin, booking, fee } = await setup();
	const id = await booking({ status: 'pending' });
	await t.mutation(apply, {
		bookingId: id,
		provider: 'test-provider',
		providerPaymentId: 'early-capture',
		grossAmountMinor: 20000,
		amountMinor: 2000,
		hostAmountMinor: 18000,
		currency: 'EUR',
		paidAt: Date.now(),
		refundedAmountMinor: 0
	});
	expect(await fee(id)).toMatchObject({
		grossAmountMinor: 20000,
		amountMinor: 2000,
		hostAmountMinor: 18000
	});
	expect((await admin.query(adminDashboard, range)).current.bookingFeeRevenue).toBe(2000);
	expect((await t.run((ctx) => ctx.db.get('bookings', id)))?.status).toBe('pending');
});

test('cash bookings cannot report an automatic split, and cancellation removes only unverified allocations', async () => {
	const { t, host, booking } = await setup();
	const cash = await booking({ paymentMethod: 'cash' });
	await expect(
		t.mutation(apply, {
			bookingId: cash,
			provider: 'test-provider',
			providerPaymentId: 'cash-capture',
			grossAmountMinor: 20000,
			amountMinor: 2000,
			hostAmountMinor: 18000,
			currency: 'EUR',
			paidAt: Date.now(),
			refundedAmountMinor: 0
		})
	).rejects.toThrow('no online commission split');
	const online = await booking();
	expect((await host.query(hostDashboard, range)).bookingFeesPending).toBe(2000);
	await host.mutation(updateStatus, { id: online, status: 'cancelled' });
	expect((await host.query(hostDashboard, range)).bookingFeesPending).toBe(0);
	expect(await t.run((ctx) => ctx.db.query('bookingFeePayments').collect())).toMatchObject([
		{ bookingId: online, pendingOnlineSplit: false }
	]);
});
