/// <reference types="vite/client" />

import { convexTest } from 'convex-test';
import { afterEach, expect, test, vi } from 'vitest';
import { api, internal } from '../../src/convex/_generated/api';
import schema from '../../src/convex/schema';
import { bookingCancellationTerms } from '../fixtures/bookingCancellationTerms.js';
import { bookingFeeBilling } from '../fixtures/accommodationBilling.js';
import { getLoyaltyLevel } from '../../src/shared/features/loyalty/utils/getLoyaltyLevel.js';
import { awardLoyaltyStay } from '../../src/convex/tables/loyaltyMemberships/helpers/awardLoyaltyStay.js';
import type { Id } from '../../src/convex/_generated/dataModel.js';

const modules = import.meta.glob('../../src/convex/**/*.ts');
const fetchMyBenefits = api.tables.loyaltyMemberships.queries.fetchMyBenefits.fetchMyBenefits;
const completeStays = internal.tables.bookings.crons.completeBookingsCron.completeBookingsCron;
afterEach(() => vi.useRealTimers());

test('levels unlock at 2, 5 and 8 completed stays', () => {
	expect(Array.from({ length: 10 }, (_, stays) => getLoyaltyLevel(stays))).toEqual([
		0, 0, 1, 1, 1, 2, 2, 2, 3, 3
	]);
});

async function setupLoyalty() {
	const t = convexTest(schema, modules);
	const accommodationId = await t.run((ctx) =>
		ctx.db.insert('accommodations', {
			...bookingFeeBilling,
			loyaltyEligible: true,
			ownerId: 'host',
			name: 'Loyalty stay',
			description: 'Test',
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
			effectivePricePerNightMinor: 8025,
			discountBps: 0,
			weekendPricePerNightMinor: null,
			recommendationSortKey: -3,
			guestRatingAverage: 0,
			guestReviewCount: 0,
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
			cancellationPolicy: { version: 1, mode: 'full_refund' },
			status: 'published',
			updatedAt: 1
		})
	);
	const booking = {
		accommodationId,
		ownerId: 'guest',
		hostId: 'host',
		firstName: 'Guest',
		lastName: 'Test',
		email: 'guest@example.com',
		phone: '+381601234567',
		checkInDate: '2026-10-01',
		checkOutDate: '2026-10-02',
		adults: 1,
		children: 0,
		paymentMethod: 'cash' as const,
		platformFeeTerms: null,
		cancellationTerms: bookingCancellationTerms('2026-10-01', '2026-10-02'),
		status: 'confirmed' as const,
		loyaltyStatus: 'pending' as const
	};
	return { t, accommodationId, booking, guest: t.withIdentity({ subject: 'guest' }) };
}

test('checkout awards each repeat stay once, upgrades levels and preserves earned membership', async () => {
	vi.useFakeTimers();
	vi.setSystemTime(new Date('2026-10-02T12:00:00Z'));
	const { t, booking, guest, accommodationId } = await setupLoyalty();
	let joinedAt: number | null = null;
	for (let stays = 1; stays <= 8; stays++) {
		const id = await t.run((ctx) =>
			ctx.db.insert('bookings', {
				...booking,
				paymentMethod: stays % 2 === 0 ? 'cash' : 'online'
			})
		);
		await t.mutation(completeStays, {});
		await t.mutation(completeStays, {});
		await t.run((ctx) => awardLoyaltyStay(ctx, id));
		const benefits = await guest.query(fetchMyBenefits, {});
		expect(benefits.qualifyingStays).toBe(stays);
		expect(benefits.level).toBe(getLoyaltyLevel(stays));
		if (stays === 1) expect(benefits.joinedAt).toBeNull();
		if (stays === 2) joinedAt = benefits.joinedAt;
		if (stays >= 2) expect(benefits.joinedAt).toBe(joinedAt);
		expect((await t.run((ctx) => ctx.db.get('bookings', id)))!.loyaltyStatus).toBe('credited');
	}
	await t.run((ctx) => ctx.db.patch('accommodations', accommodationId, { loyaltyEligible: false }));
	vi.setSystemTime(new Date('2040-01-01'));
	expect(await guest.query(fetchMyBenefits, {})).toEqual({
		level: 3,
		qualifyingStays: 8,
		joinedAt
	});
});

test('only finished eligible stays count, anonymous credit waits for verified account linking', async () => {
	vi.useFakeTimers();
	vi.setSystemTime(new Date('2026-10-02T12:00:00Z'));
	const { t, booking, guest } = await setupLoyalty();
	const ids = await t.run(async (ctx) => {
		const ids: Id<'bookings'>[] = [];
		for (const status of ['pending', 'cancelled', 'declined', 'expired'] as const) {
			ids.push(await ctx.db.insert('bookings', { ...booking, status }));
		}
		ids.push(await ctx.db.insert('bookings', { ...booking, loyaltyStatus: 'ineligible' }));
		ids.push(
			await ctx.db.insert('bookings', {
				...booking,
				cancellationTerms: bookingCancellationTerms('2026-10-02', '2026-10-03')
			})
		);
		return ids;
	});
	const anonymousId = await t.run((ctx) =>
		ctx.db.insert('bookings', { ...booking, ownerId: undefined })
	);
	await t.mutation(completeStays, {});
	for (const id of ids) await t.run((ctx) => awardLoyaltyStay(ctx, id));
	expect((await guest.query(fetchMyBenefits, {})).qualifyingStays).toBe(0);
	await t.run(async (ctx) => {
		await ctx.db.patch('bookings', anonymousId, { ownerId: 'guest' });
		await awardLoyaltyStay(ctx, anonymousId);
		await awardLoyaltyStay(ctx, anonymousId);
	});
	expect((await guest.query(fetchMyBenefits, {})).qualifyingStays).toBe(1);
});

test('automatic completion drains bounded batches without losing or duplicating credits', async () => {
	vi.useFakeTimers();
	vi.setSystemTime(new Date('2026-10-02T12:00:00Z'));
	const { t, booking, guest } = await setupLoyalty();
	await t.run(async (ctx) => {
		for (let index = 0; index < 30; index++) await ctx.db.insert('bookings', booking);
	});
	expect(await t.mutation(completeStays, {})).toBe(25);
	await t.finishAllScheduledFunctions(() => vi.runAllTimersAsync());
	expect((await guest.query(fetchMyBenefits, {})).qualifyingStays).toBe(30);
	expect(await t.mutation(completeStays, {})).toBe(0);
});

test('benefits require authentication and expose only the signed-in guest membership', async () => {
	const t = convexTest(schema, modules);
	const membershipId = await t.run((ctx) =>
		ctx.db.insert('loyaltyMemberships', {
			level: 0,
			ownerId: 'guest',
			qualifyingStays: 3,
			joinedAt: 1000
		})
	);
	await expect(t.query(fetchMyBenefits, {})).rejects.toThrow();
	const guest = t.withIdentity({ subject: 'guest', tokenIdentifier: 'issuer|guest' });
	const stranger = t.withIdentity({ subject: 'stranger', tokenIdentifier: 'issuer|stranger' });
	expect(await guest.query(fetchMyBenefits, {})).toEqual({
		level: 0,
		qualifyingStays: 3,
		joinedAt: 1000
	});
	expect(await stranger.query(fetchMyBenefits, {})).toEqual({
		level: 0,
		qualifyingStays: 0,
		joinedAt: null
	});
	await t.run((ctx) => ctx.db.patch('loyaltyMemberships', membershipId, { level: 2 }));
	expect(await guest.query(fetchMyBenefits, {})).toEqual({
		level: 2,
		qualifyingStays: 3,
		joinedAt: 1000
	});
});

test('account cleanup removes only that account membership and can be retried', async () => {
	const t = convexTest(schema, modules);
	await t.run(async (ctx) => {
		for (const ownerId of ['guest', 'stranger']) {
			await ctx.db.insert('loyaltyMemberships', {
				level: 0,
				ownerId,
				qualifyingStays: 1,
				joinedAt: 1000
			});
		}
	});
	for (let attempt = 0; attempt < 2; attempt++) {
		await t.mutation(internal.betterAuth.cleanupDeletedUserData.cleanupDeletedUserData, {
			ownerId: 'guest'
		});
	}
	const owners = await t.run(async (ctx) =>
		(await ctx.db.query('loyaltyMemberships').take(3)).map((membership) => membership.ownerId)
	);
	expect(owners).toEqual(['stranger']);
});
