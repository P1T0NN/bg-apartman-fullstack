/// <reference types="vite/client" />

// LIBRARIES
import aggregateTest from '@convex-dev/aggregate/test';
import rateLimiterTest from '@convex-dev/rate-limiter/test';
import { convexTest } from 'convex-test';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

// CONVEX
import { api, internal } from '../../src/convex/_generated/api.js';
import schema from '../../src/convex/schema.js';

// AGGREGATES
import { bookingAdminAggregate } from '../../src/convex/tables/bookings/aggregates/bookingAdminAggregate.js';

// HELPERS
import { syncFlatFeeRevenueAggregate } from '../../src/convex/tables/accommodationFeePayments/helpers/syncFlatFeeRevenueAggregate.js';
import { syncHostBookingAggregate } from '../../src/convex/tables/bookings/helpers/syncHostBookingAggregate.js';

// FIXTURES
import { bookingCancellationTerms } from '../fixtures/bookingCancellationTerms.js';

// TYPES
import type { Doc } from '../../src/convex/_generated/dataModel.js';

const modules = import.meta.glob('../../src/convex/**/*.ts');
const dashboard =
	api.tables.accommodationFeePayments.queries.fetchAdminDashboard.fetchAdminDashboard;
const series =
	api.tables.accommodationFeePayments.queries.fetchAdminRevenueSeries.fetchAdminRevenueSeries;
const apply = internal.tables.accommodationFeePayments.mutations.applyFeeCheckout.applyFeeCheckout;
const refund = internal.tables.accommodationFeePayments.mutations.applyFeeRefund.applyFeeRefund;
const range = {
	from: Date.parse('2026-10-18T00:00:00Z'),
	to: Date.parse('2026-10-19T23:59:59.999Z')
};

beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(new Date('2026-10-19T12:00:00Z'));
});
afterEach(() => vi.useRealTimers());

async function setup() {
	const t = convexTest(schema, modules);
	for (const name of [
		'accommodationOwnerAggregate',
		'bookingAdminAggregate',
		'bookingFeeDueAggregate',
		'bookingFeePendingAggregate',
		'bookingFeePaidAggregate',
		'bookingFeeRevenueAggregate',
		'bookingHostAggregate',
		'flatFeeRevenueAggregate'
	])
		aggregateTest.register(t, name);
	rateLimiterTest.register(t);
	await t.mutation(internal.seed.seedAccommodations, { ownerId: 'host', count: 1 });
	const accommodationId = await t.run(async (ctx) => {
		const listing = await ctx.db.query('accommodations').first();
		if (!listing) throw new Error('Missing fixture.');
		await ctx.db.patch('accommodations', listing._id, {
			billingPlanId: 'flat_fee',
			billingTerms: { model: 'flat_fee', amountMinor: 30000, currency: 'EUR', intervalMonths: 3 },
			billingStatus: 'pending_payment'
		});
		return listing._id;
	});
	async function receipt(overrides: Partial<Doc<'accommodationFeePayments'>> = {}) {
		return t.run(async (ctx) => {
			const id = await ctx.db.insert('accommodationFeePayments', {
				accommodationId,
				ownerId: 'host',
				provider: 'test-provider',
				terms: { amountMinor: 30000, currency: 'EUR', intervalMonths: 3 },
				status: 'pending',
				createdAt: Date.now(),
				expiresAt: Date.now() + 60000,
				entitlementApplied: false,
				invalidated: false,
				refundedAmountMinor: 0,
				updatedAt: Date.now(),
				...overrides
			});
			const payment = await ctx.db.get('accommodationFeePayments', id);
			if (!payment) throw new Error('Missing payment.');
			await syncFlatFeeRevenueAggregate(ctx, payment);
			return id;
		});
	}
	async function booking(status: Doc<'bookings'>['status']) {
		return t.run(async (ctx) => {
			const id = await ctx.db.insert('bookings', {
				accommodationId,
				hostId: 'host',
				status,
				paymentMethod: 'cash',
				loyaltyStatus: 'ineligible',
				platformFeeTerms: null,
				cancellationTerms: bookingCancellationTerms('2026-11-01', '2026-11-03'),
				firstName: 'Guest',
				lastName: 'Test',
				email: 'guest@example.com',
				phone: '+381600000000',
				checkInDate: '2026-11-01',
				checkOutDate: '2026-11-03',
				adults: 1,
				children: 0
			});
			const stored = await ctx.db.get('bookings', id);
			if (!stored) throw new Error('Missing booking.');
			await bookingAdminAggregate.insert(ctx, stored);
			await syncHostBookingAggregate(ctx, stored);
			return id;
		});
	}
	return {
		t,
		admin: t.withIdentity({ subject: 'admin', role: 'admin' }),
		accommodationId,
		receipt,
		booking
	};
}

test('admin-only endpoints validate ranges and do not count billing overrides as revenue', async () => {
	const { t, admin, accommodationId } = await setup();
	for (const query of [dashboard, series]) {
		await expect(t.query(query, range)).rejects.toThrow('UNAUTHENTICATED');
		await expect(t.withIdentity({ subject: 'host' }).query(query, range)).rejects.toThrow(
			'FORBIDDEN'
		);
		for (const invalid of [
			{ from: range.to, to: range.from },
			{ from: 0, to: 367 * 86400000 }
		]) {
			await expect(admin.query(query, invalid)).rejects.toThrow('INVALID_ANALYTICS_RANGE');
		}
	}
	await t.run((ctx) =>
		ctx.db.patch('accommodations', accommodationId, {
			billingStatus: 'active',
			billingPeriodEndsAt: range.to + 86400000
		})
	);
	expect((await admin.query(dashboard, range)).current).toEqual({
		revenue: 0,
		flatFeeRevenue: 0,
		bookingFeeRevenue: 0,
		bookings: 0,
		cancellationRate: 0
	});
	expect(await admin.query(series, range)).toEqual([
		{ date: range.from, revenue: 0 },
		{ date: Date.parse('2026-10-19T00:00:00Z'), revenue: 0 }
	]);
});

test('captures and confirmed refunds update revenue once, including replayed and stale events', async () => {
	const { t, admin, receipt } = await setup();
	const paymentId = await receipt();
	const paid = {
		paymentId,
		provider: 'test-provider',
		providerCheckoutId: 'checkout-1',
		providerPaymentId: 'payment-1',
		amountMinor: 30000,
		currency: 'EUR',
		status: 'paid' as const,
		refundedAmountMinor: 0
	};
	await t.mutation(apply, paid);
	await t.mutation(apply, paid);
	expect((await admin.query(dashboard, range)).current.flatFeeRevenue).toBe(30000);
	const refundArgs = {
		provider: 'test-provider',
		providerPaymentId: 'payment-1',
		amountMinor: 30000,
		currency: 'EUR',
		refundedAmountMinor: 5000,
		refundStatus: 'succeeded' as const
	};
	await t.mutation(refund, refundArgs);
	await t.mutation(refund, { ...refundArgs, refundedAmountMinor: 1000 });
	await t.mutation(apply, paid);
	expect((await admin.query(dashboard, range)).current.revenue).toBe(25000);
	expect((await admin.query(series, range)).map((point) => point.revenue)).toEqual([0, 25000]);
	await admin.mutation(
		internal.tables.accommodationFeePayments.mutations.requestFeeRefund.requestFeeRefund,
		{ paymentId, expectedAmountMinor: 25000 }
	);
	expect((await admin.query(dashboard, range)).current.revenue).toBe(25000);
	await t.mutation(refund, { ...refundArgs, refundedAmountMinor: 30000 });
	await t.mutation(apply, paid);
	expect((await admin.query(dashboard, range)).current.revenue).toBe(0);
});

test('uses payment dates, currency and every paid receipt, while excluding unpaid attempts and booking values', async () => {
	const { admin, receipt, booking } = await setup();
	await receipt({
		status: 'paid',
		paidAt: range.from,
		terms: { amountMinor: 10000, currency: 'EUR', intervalMonths: 1 }
	});
	await receipt({
		status: 'refund_pending',
		invalidated: true,
		paidAt: range.to,
		terms: { amountMinor: 20000, currency: 'EUR', intervalMonths: 2 },
		refundedAmountMinor: 3000
	});
	await receipt({
		status: 'paid',
		paidAt: Date.parse('2026-10-17T12:00:00Z'),
		terms: { amountMinor: 5000, currency: 'EUR', intervalMonths: 1 }
	});
	await receipt({
		status: 'paid',
		paidAt: range.from,
		terms: { amountMinor: 99000, currency: 'USD', intervalMonths: 1 }
	});
	await receipt({ status: 'failed' });
	await receipt({ status: 'processing' });
	await booking('completed');
	const result = await admin.query(dashboard, range);
	expect(result.current).toEqual({
		revenue: 27000,
		flatFeeRevenue: 27000,
		bookingFeeRevenue: 0,
		bookings: 1,
		cancellationRate: 0
	});
	expect(result.previous.flatFeeRevenue).toBe(5000);
	expect((await admin.query(series, range)).map((point) => point.revenue)).toEqual([10000, 17000]);
});

test('booking status transitions update the cancellation rate without changing the booking count', async () => {
	const { t, admin, booking } = await setup();
	const id = await booking('confirmed');
	await booking('cancelled');
	await booking('declined');
	await booking('completed');
	expect((await admin.query(dashboard, range)).current).toMatchObject({
		bookings: 4,
		cancellationRate: 25
	});
	await t
		.withIdentity({ subject: 'host' })
		.mutation(api.tables.bookings.mutations.updateBookingStatus.updateBookingStatus, {
			id,
			status: 'cancelled'
		});
	expect((await admin.query(dashboard, range)).current).toMatchObject({
		bookings: 4,
		cancellationRate: 50
	});
});

test('a recorded refund after a plan switch updates earnings and the chart while preserving the new plan', async () => {
	const { t, admin, accommodationId, receipt } = await setup();
	const paymentId = await receipt();
	await t.mutation(apply, {
		paymentId,
		provider: 'test-provider',
		providerCheckoutId: 'switch-checkout',
		providerPaymentId: 'switch-payment',
		amountMinor: 30000,
		currency: 'EUR',
		status: 'paid',
		refundedAmountMinor: 0
	});
	await admin.mutation(
		api.tables.accommodations.mutations.updateAccommodationFeeForAdmin
			.updateAccommodationFeeForAdmin,
		{
			id: accommodationId,
			billingTerms: { model: 'booking_fee', commissionBps: 1000 },
			billingStatus: 'active',
			billingPeriodEndsAt: null
		}
	);
	expect((await admin.query(dashboard, range)).current.flatFeeRevenue).toBe(30000);
	await admin.mutation(
		internal.tables.accommodationFeePayments.mutations.requestFeeRefund.requestFeeRefund,
		{ paymentId, expectedAmountMinor: 30000 }
	);
	expect((await admin.query(dashboard, range)).current.flatFeeRevenue).toBe(30000);
	await t.mutation(refund, {
		provider: 'test-provider',
		providerPaymentId: 'switch-payment',
		amountMinor: 30000,
		currency: 'EUR',
		refundedAmountMinor: 30000,
		refundStatus: 'succeeded'
	});
	expect((await admin.query(dashboard, range)).current).toMatchObject({
		revenue: 0,
		flatFeeRevenue: 0,
		bookingFeeRevenue: 0
	});
	expect((await admin.query(series, range)).every((point) => point.revenue === 0)).toBe(true);
	expect(await t.run((ctx) => ctx.db.get('accommodations', accommodationId))).toMatchObject({
		billingPlanId: 'booking_fee',
		billingStatus: 'active',
		billingPeriodEndsAt: null
	});
});
