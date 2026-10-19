/// <reference types="vite/client" />

// LIBRARIES
import aggregateTest from '@convex-dev/aggregate/test';
import { convexTest } from 'convex-test';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

// CONVEX
import { api } from '../../src/convex/_generated/api.js';
import schema from '../../src/convex/schema.js';

// CONFIG
import { COMPANY_DATA } from '../../src/shared/config.js';

// HELPERS
import { syncHostBookingAggregate } from '../../src/convex/tables/bookings/helpers/syncHostBookingAggregate.js';

// FIXTURES
import { bookingFeeBilling } from '../fixtures/accommodationBilling.js';
import { bookingCancellationTerms } from '../fixtures/bookingCancellationTerms.js';

// TYPES
import type { Doc } from '../../src/convex/_generated/dataModel.js';

const modules = import.meta.glob('../../src/convex/**/*.ts');
const dashboard = api.tables.bookings.queries.fetchHostDashboard.fetchHostDashboard;
const series = api.tables.bookings.queries.fetchHostRevenueSeries.fetchHostRevenueSeries;
const range = {
	from: Date.parse('2026-10-10T00:00:00Z'),
	to: Date.parse('2026-10-11T23:59:59.999Z')
};

beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(new Date('2026-10-10T12:00:00Z'));
});

afterEach(() => {
	vi.useRealTimers();
	Object.defineProperty(COMPANY_DATA, 'TIMEZONE', { value: 'UTC' });
});

async function setup() {
	const t = convexTest(schema, modules);
	aggregateTest.register(t, 'bookingHostAggregate');
	aggregateTest.register(t, 'bookingAdminAggregate');
	aggregateTest.register(t, 'bookingFeeDueAggregate');
	aggregateTest.register(t, 'bookingFeePendingAggregate');
	aggregateTest.register(t, 'bookingFeePaidAggregate');
	aggregateTest.register(t, 'bookingFeeRevenueAggregate');
	const accommodationId = await t.run((ctx) =>
		ctx.db.insert('accommodations', {
			...bookingFeeBilling,
			ownerId: 'host',
			name: 'Analytics stay',
			description: '',
			type: 'apartment',
			spaceType: 'entire',
			address: { street: 'Test', streetNumber: '1', city: 'Belgrade', country: 'Serbia' },
			latitude: 44.8,
			longitude: 20.4,
			maxGuests: 2,
			bedrooms: 1,
			beds: 1,
			bathrooms: 1,
			pricePerNightMinor: 8025,
			discountBps: 0,
			weekendPricePerNightMinor: null,
			effectivePricePerNightMinor: 8025,
			recommendationSortKey: -3,
			guestRatingAverage: 0,
			guestReviewCount: 0,
			loyaltyEligible: false,
			amenities: [],
			imageKeys: [],
			checkInStart: '14:00',
			checkInEnd: '22:00',
			checkOut: '11:00',
			timeZone: 'Europe/Belgrade',
			minimumStay: 1,
			smokingAllowed: false,
			petsAllowed: false,
			partiesAllowed: false,
			houseRules: '',
			supportedPaymentMethods: 'both',
			sameDayReservation: false,
			cancellationPolicy: { version: 1, mode: 'flexible' },
			status: 'published',
			updatedAt: Date.now()
		})
	);
	async function insert(
		status: Doc<'bookings'>['status'],
		amount: number,
		hostId: string | undefined = 'host',
		currency = 'EUR',
		paymentMethod: 'cash' | 'online' = 'cash'
	) {
		return t.run(async (ctx) => {
			const terms = bookingCancellationTerms('2026-11-01', '2026-11-03');
			const id = await ctx.db.insert('bookings', {
				accommodationId,
				hostId,
				status,
				paymentMethod,
				loyaltyStatus: 'ineligible',
				platformFeeTerms: null,
				firstName: 'Guest',
				lastName: 'Test',
				email: 'guest@example.com',
				phone: '+381601234567',
				checkInDate: '2026-11-01',
				checkOutDate: '2026-11-03',
				adults: 1,
				children: 0,
				cancellationTerms: {
					...terms,
					currency,
					stayPricing: { ...terms.stayPricing, totalMinor: amount }
				}
			});
			const booking = await ctx.db.get('bookings', id);
			if (booking) await syncHostBookingAggregate(ctx, booking);
			return id;
		});
	}
	return { t, accommodationId, insert, host: t.withIdentity({ subject: 'host' }) };
}

test('host metrics include accepted cash/online bookings and frozen prices, partitioned by host and currency', async () => {
	const { t, host, insert, accommodationId } = await setup();
	const confirmed = await insert('confirmed', 12345);
	await insert('completed', 9876, 'host', 'EUR', 'online');
	for (const status of ['pending', 'declined', 'cancelled', 'expired'] as const)
		await insert(status, 999999);
	await insert('confirmed', 54321, 'other-host');
	await insert('confirmed', 77777, 'host', 'USD');
	await t.run(async (ctx) => {
		await ctx.db.patch('bookings', confirmed, { hostArchivedAt: Date.now() });
		await ctx.db.patch('accommodations', accommodationId, {
			pricePerNightMinor: 999999,
			status: 'deleted',
			deletedAt: Date.now()
		});
	});
	const stats = await host.query(dashboard, range);
	expect(stats.current).toEqual({
		bookings: 2,
		revenue: 22221,
		bookingFeesPaid: 0,
		cancellationRate: null
	});
	const points = await host.query(series, range);
	expect(points).toHaveLength(2);
	expect(points.reduce((sum, point) => sum + point.revenue, 0)).toBe(stats.current.revenue);
	expect(
		(await t.withIdentity({ subject: 'other-host' }).query(dashboard, range)).current
	).toMatchObject({
		bookings: 1,
		revenue: 54321
	});
});

test('backfill/lifecycle synchronization is idempotent and cancellations remove the original contribution', async () => {
	const { t, host, insert } = await setup();
	const id = await insert('confirmed', 10001);
	for (const status of ['confirmed', 'completed', 'completed', 'cancelled', 'cancelled'] as const) {
		await t.run(async (ctx) => {
			await ctx.db.patch('bookings', id, { status });
			const booking = await ctx.db.get('bookings', id);
			if (booking) await syncHostBookingAggregate(ctx, booking);
		});
		const included = status !== 'cancelled';
		expect((await host.query(dashboard, range)).current).toMatchObject({
			bookings: included ? 1 : 0,
			revenue: included ? 10001 : 0
		});
	}
});

test('current/previous ranges and daily buckets use creation time with inclusive endpoints', async () => {
	vi.setSystemTime(new Date('2026-10-08T12:00:00Z'));
	const { host, insert } = await setup();
	await insert('completed', 777);
	vi.setSystemTime(new Date(range.from));
	await insert('confirmed', 101);
	vi.setSystemTime(new Date('2026-10-11T12:00:00Z'));
	await insert('confirmed', 202);
	vi.setSystemTime(new Date(range.to + 1));
	await insert('confirmed', 999);
	const stats = await host.query(dashboard, range);
	expect(stats.current).toMatchObject({ bookings: 2, revenue: 303 });
	expect(stats.previous).toMatchObject({ bookings: 1, revenue: 777 });
	expect(await host.query(series, range)).toEqual([
		{ date: range.from, revenue: 101 },
		{ date: Date.parse('2026-10-11T00:00:00Z'), revenue: 202 }
	]);
});

test('analytics enforce authentication and bounded valid ranges, returning real zeros for an empty host', async () => {
	const { t, host } = await setup();
	for (const query of [dashboard, series]) {
		await expect(t.query(query, range)).rejects.toMatchObject({
			data: { code: 'UNAUTHENTICATED' }
		});
		for (const invalid of [
			{ from: -1, to: 0 },
			{ from: 2, to: 1 },
			{ from: 0.1, to: 1 },
			{ from: 0, to: Number.POSITIVE_INFINITY },
			{ from: 0, to: 366 * 86400000 }
		])
			await expect(host.query(query, invalid)).rejects.toMatchObject({
				data: { code: 'INVALID_ANALYTICS_RANGE' }
			});
	}
	expect((await host.query(dashboard, range)).current).toMatchObject({ bookings: 0, revenue: 0 });
	expect(await host.query(series, { from: 0, to: 366 * 86400000 - 1 })).toHaveLength(366);
	expect(
		await host.query(series, {
			from: Date.UTC(9999, 11, 31),
			to: Date.UTC(9999, 11, 31, 23, 59, 59, 999)
		})
	).toHaveLength(1);
});

test('calendar buckets remain correct through daylight-saving transitions', async () => {
	Object.defineProperty(COMPANY_DATA, 'TIMEZONE', { value: 'Europe/Belgrade' });
	for (const [from, middle, to, expectedHours] of [
		['2026-03-28T23:00:00Z', '2026-03-29T12:00:00Z', '2026-03-30T21:59:59.999Z', 23],
		['2026-10-24T22:00:00Z', '2026-10-25T12:00:00Z', '2026-10-26T22:59:59.999Z', 25]
	] as const) {
		vi.setSystemTime(new Date(middle));
		const { host, insert } = await setup();
		await insert('confirmed', 123);
		const dates = { from: Date.parse(from), to: Date.parse(to) };
		const points = await host.query(series, dates);
		expect(points).toHaveLength(2);
		expect((points[1].date - points[0].date) / 3600000).toBe(expectedHours);
		expect(points.map((point) => point.revenue)).toEqual([123, 0]);
		expect((await host.query(dashboard, dates)).current.revenue).toBe(123);
	}
});
