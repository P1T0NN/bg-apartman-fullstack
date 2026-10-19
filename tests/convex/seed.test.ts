/// <reference types="vite/client" />

// LIBRARIES
import aggregateTest from '@convex-dev/aggregate/test';
import { convexTest } from 'convex-test';
import { afterEach, expect, test, vi } from 'vitest';

// CONVEX
import { api, components, internal } from '../../src/convex/_generated/api.js';
import schema from '../../src/convex/schema.js';
import authSchema from '../../src/convex/betterAuth/component/schema.js';

// AGGREGATES
import { bookingHostAggregate } from '../../src/convex/tables/bookings/aggregates/bookingHostAggregate.js';
import { bookingOwnerAggregate } from '../../src/convex/tables/bookings/aggregates/bookingOwnerAggregate.js';
import { reviewAggregate } from '../../src/convex/tables/reviews/aggregates/reviewAggregate.js';
import { userTotalAggregate } from '../../src/convex/betterAuth/tables/users/aggregates/userTotalAggregate.js';
import { syncHostBookingAggregate } from '../../src/convex/tables/bookings/helpers/syncHostBookingAggregate.js';
import { bookingFeePendingAggregate } from '../../src/convex/tables/bookingFeePayments/aggregates/bookingFeeAggregates.js';

const modules = import.meta.glob('../../src/convex/**/*.ts');
afterEach(() => vi.unstubAllEnvs());

test('booking seed and cleanup keep guest, host and review aggregates consistent', async () => {
	const t = convexTest(schema, modules);
	for (const name of [
		'accommodationOwnerAggregate',
		'bookingHostAggregate',
		'bookingAdminAggregate',
		'bookingFeeDueAggregate',
		'bookingFeePendingAggregate',
		'bookingFeePaidAggregate',
		'bookingFeeRevenueAggregate',
		'bookingOwnerAggregate',
		'reviewsAggregate',
		'userTotalAggregate'
	]) {
		aggregateTest.register(t, name);
	}
	t.registerComponent(
		'betterAuth',
		authSchema,
		import.meta.glob('../../src/convex/betterAuth/component/**/*.ts')
	);
	vi.stubEnv('CONVEX_CLOUD_URL', 'https://production.example.com');
	await expect(t.mutation(internal.seed.seedAccommodations, { count: 1 })).rejects.toThrow(
		'restricted to the development deployment'
	);
	vi.stubEnv('CONVEX_CLOUD_URL', 'https://grateful-otter-919.eu-west-1.convex.cloud');
	await t.mutation(internal.seed.seedAccommodations, { count: 1 });
	const ownerId = await t.run(async (ctx) => {
		const listing = await ctx.db.query('accommodations').first();
		if (!listing) throw new Error('Missing seed listing.');
		return listing.ownerId;
	});
	expect(
		await t.query(components.betterAuth.queries.fetchUser.fetchUser, { id: ownerId })
	).toMatchObject({ payoutsEnabled: true });
	for (const query of [
		api.tables.accommodations.queries.fetchAccommodationsSearch.fetchAccommodationsSearch,
		api.tables.accommodations.queries.fetchAccommodationsMapSearch.fetchAccommodationsMap
	]) {
		expect(
			(
				await t.query(query, {
					location: { country: 'Serbia' },
					paginationOpts: { cursor: null, numItems: 10 }
				})
			).items
		).toHaveLength(1);
	}
	const inserted = await t.mutation(internal.seed.seedReviews, {});
	expect(inserted).toBeGreaterThan(0);
	await t.run(async (ctx) => {
		const bookings = await ctx.db.query('bookings').take(20);
		expect(bookings).toHaveLength(inserted);
		expect(await ctx.db.query('bookingFeePayments').take(20)).toHaveLength(0);
		expect(await bookingFeePendingAggregate.sum(ctx, { namespace: [ownerId, 'EUR'] })).toBe(0);
		expect(await userTotalAggregate.count(ctx)).toBe(1);
		expect(await bookingHostAggregate.count(ctx, { namespace: [ownerId, 'EUR'] })).toBe(inserted);
		expect(await bookingHostAggregate.sum(ctx, { namespace: [ownerId, 'EUR'] })).toBe(
			bookings.reduce((sum, booking) => sum + booking.cancellationTerms.stayPricing.totalMinor, 0)
		);
		for (const ownerId of new Set(bookings.map((booking) => booking.ownerId))) {
			expect(await bookingOwnerAggregate.count(ctx, { namespace: ownerId })).toBe(
				bookings.filter((booking) => booking.ownerId === ownerId).length
			);
		}
	});
	expect(await t.mutation(internal.seed.clearSeededReviews, {})).toBe(inserted);
	await t.run(async (ctx) => {
		expect(await ctx.db.query('bookings').first()).toBeNull();
		expect(await ctx.db.query('bookingFeePayments').first()).toBeNull();
		expect(await bookingFeePendingAggregate.sum(ctx, { namespace: [ownerId, 'EUR'] })).toBe(0);
		expect(await ctx.db.query('reviews').first()).toBeNull();
		expect(await bookingHostAggregate.count(ctx, { namespace: [ownerId, 'EUR'] })).toBe(0);
		for await (const namespace of bookingOwnerAggregate.iterNamespaces(ctx)) {
			expect(await bookingOwnerAggregate.count(ctx, { namespace })).toBe(0);
		}
		const accommodation = await ctx.db.query('accommodations').first();
		expect(accommodation).not.toBeNull();
		if (!accommodation) throw new Error('Seeded accommodation disappeared.');
		expect(accommodation.guestReviewCount).toBe(0);
		expect(await reviewAggregate.count(ctx, { namespace: accommodation._id })).toBe(0);
	});
	expect(await t.mutation(internal.seed.seedReviews, {})).toBe(inserted);
	await t.run(async (ctx) => {
		const booking = await ctx.db.query('bookings').first();
		if (!booking) throw new Error('Missing seeded booking');
		await ctx.db.patch('bookings', booking._id, { paymentMethod: 'online' });
		await syncHostBookingAggregate(ctx, { ...booking, paymentMethod: 'online' });
	});
	const fee = await t.run((ctx) => ctx.db.query('bookingFeePayments').first());
	if (!fee) throw new Error('Missing seeded fee');
	await t.mutation(
		internal.tables.bookingFeePayments.mutations.applyBookingFeePayment.applyBookingFeePayment,
		{
			bookingId: fee.bookingId,
			grossAmountMinor: fee.grossAmountMinor,
			hostAmountMinor: fee.hostAmountMinor,
			provider: 'test-provider',
			providerPaymentId: 'seed-payment',
			amountMinor: fee.amountMinor,
			currency: fee.currency,
			paidAt: Date.now(),
			refundedAmountMinor: 0
		}
	);
	await expect(t.mutation(internal.seed.clearSeededReviews, {})).rejects.toThrow(
		'Cannot delete collected booking fee history'
	);
	await t.run(async (ctx) => {
		expect(await ctx.db.query('bookings').take(20)).toHaveLength(inserted);
		expect(await ctx.db.query('reviews').take(20)).toHaveLength(inserted);
		expect((await ctx.db.get('bookingFeePayments', fee._id))?.paidAt).toBeDefined();
	});
});
