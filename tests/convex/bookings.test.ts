/// <reference types="vite/client" />

import { ACCOMMODATION_CONFIG } from '../../src/shared/features/accommodations/config';
import {
	bookingCancellationTerms,
	withExpectedTotal
} from '../fixtures/bookingCancellationTerms.js';

import aggregateTest from '@convex-dev/aggregate/test';
import rateLimiterTest from '@convex-dev/rate-limiter/test';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { convexTest, type TestConvex } from 'convex-test';
import { api, components } from '../../src/convex/_generated/api';
import schema from '../../src/convex/schema';
import authSchema from '../../src/convex/betterAuth/component/schema';
import { registerResend, successfulResendResponse } from '../fixtures/resend';
import { bookingFeeBilling } from '../fixtures/accommodationBilling.js';
import { LOYALTY_CONFIG } from '../../src/shared/features/loyalty/config.js';
import { calculateLoyaltyQuote } from '../../src/shared/features/loyalty/utils/calculateLoyaltyQuote.js';
import { formatLoyaltyBookingBenefits } from '../../src/convex/tables/loyaltyMemberships/emails/formatLoyaltyBookingBenefits.js';

const modules = import.meta.glob('../../src/convex/**/*.ts');

beforeEach(() => {
	vi.useFakeTimers();
	vi.stubEnv('RESEND_API_KEY', 'test-key');
	vi.stubEnv('EMAIL_FROM', 'test@example.com');
	vi.stubGlobal(
		'fetch',
		vi
			.fn()
			.mockImplementation((_url, options) =>
				Promise.resolve(successfulResendResponse(options?.body))
			)
	);
});

const testBackends: TestConvex<typeof schema>[] = [];
afterEach(async () => {
	vi.useFakeTimers();
	for (const t of testBackends) await t.finishAllScheduledFunctions(() => vi.runAllTimersAsync());
	testBackends.length = 0;
	vi.useRealTimers();
	vi.unstubAllEnvs();
	vi.unstubAllGlobals();
	LOYALTY_CONFIG.BOOKING_ENABLED = false;
	LOYALTY_CONFIG.DISCOUNT_MODE = null;
});

test('loyalty pricing is authoritative, rejects changed services and freezes the accepted rewards', async () => {
	LOYALTY_CONFIG.BOOKING_ENABLED = true;
	LOYALTY_CONFIG.DISCOUNT_MODE = 'stack';
	const { t, hostId } = await setup();
	const property = {
		...bookingFeeBilling,
		...accommodation,
		ownerId: hostId,
		supportedPaymentMethods: 'both' as const,
		discountBps: 1000,
		effectivePricePerNightMinor: 7223,
		weekendPricePerNightMinor: 12000,
		loyaltyServices: { parking: true, breakfast: true, spa: false }
	};
	const accommodationId = await t.run((ctx) => ctx.db.insert('accommodations', property));
	const membershipId = await t.run((ctx) =>
		ctx.db.insert('loyaltyMemberships', {
			ownerId: 'loyalty-guest',
			qualifyingStays: 0,
			level: 2,
			joinedAt: 1000
		})
	);
	const member = t.withIdentity({
		subject: 'loyalty-guest',
		tokenIdentifier: 'issuer|loyalty-guest'
	});
	const quote = calculateLoyaltyQuote(
		property,
		'2999-07-20',
		'2999-07-23',
		2,
		property.loyaltyServices,
		4,
		'stack'
	);
	const request = {
		...guest,
		accommodationId,
		checkInDate: '2999-07-20',
		checkOutDate: '2999-07-23',
		adults: 2,
		children: 2,
		expectedPricePerNightMinor: quote.pricing.effectivePricePerNightMinor,
		expectedTotalMinor: quote.stayPricing.totalMinor,
		expectedLoyaltyBenefits: quote.benefits
	};

	await expect(t.mutation(createBooking, request)).rejects.toThrow('BOOKING_PRICE_CHANGED');
	await expect(
		member.mutation(createBooking, { ...request, expectedLoyaltyBenefits: null })
	).rejects.toThrow('BOOKING_BENEFITS_CHANGED');
	await t.run((ctx) =>
		ctx.db.patch('accommodations', accommodationId, {
			loyaltyServices: { parking: true, breakfast: false, spa: false }
		})
	);
	await expect(member.mutation(createBooking, request)).rejects.toThrow('BOOKING_BENEFITS_CHANGED');
	await t.run((ctx) =>
		ctx.db.patch('accommodations', accommodationId, { loyaltyServices: property.loyaltyServices })
	);

	const id = await member.mutation(createBooking, request);
	const accepted = await t.run((ctx) => ctx.db.get('bookings', id));
	expect(accepted!.cancellationTerms.loyaltyBenefits).toEqual(quote.benefits);
	expect(accepted!.cancellationTerms.pricePerNightMinor).toBe(
		quote.pricing.effectivePricePerNightMinor
	);
	expect(accepted!.platformFeeTerms!.baseAmountMinor).toBe(quote.stayPricing.totalMinor);
	expect(accepted!.cancellationTerms.loyaltyBenefits!.breakfastGuests).toBe(2);

	await t.run(async (ctx) => {
		await ctx.db.patch('loyaltyMemberships', membershipId, { level: 3 });
		await ctx.db.patch('accommodations', accommodationId, {
			pricePerNightMinor: 20000,
			effectivePricePerNightMinor: 18000,
			loyaltyServices: { parking: false, breakfast: false, spa: false }
		});
	});
	const confirmation = await t.query(
		api.tables.bookings.queries.fetchBookingConfirmation.fetchBookingConfirmation,
		{ id }
	);
	expect(confirmation!.cancellationTerms).toEqual(accepted!.cancellationTerms);
	const emailLines = formatLoyaltyBookingBenefits(confirmation!.cancellationTerms);
	expect(emailLines).toContain('Free parking');
	expect(emailLines).toContain('Free breakfast for up to 2 people');
	expect(emailLines).toContain('Breakfast covers 2 booked guests');
	expect(emailLines).not.toContain('Free spa access');
});

test('existing levels do not apply benefits to online bookings or while the rollout is disabled', async () => {
	LOYALTY_CONFIG.BOOKING_ENABLED = true;
	LOYALTY_CONFIG.DISCOUNT_MODE = 'stack';
	const { t, hostId } = await setup();
	const property = {
		...bookingFeeBilling,
		...accommodation,
		ownerId: hostId,
		supportedPaymentMethods: 'both' as const,
		loyaltyServices: { parking: true, breakfast: true, spa: true }
	};
	const accommodationId = await t.run((ctx) => ctx.db.insert('accommodations', property));
	await t.run((ctx) =>
		ctx.db.insert('loyaltyMemberships', {
			ownerId: 'loyalty-guest',
			level: 3,
			qualifyingStays: 1,
			joinedAt: 1000
		})
	);
	const member = t.withIdentity({
		subject: 'loyalty-guest',
		tokenIdentifier: 'issuer|loyalty-guest'
	});
	const request = withExpectedTotal({
		...guest,
		accommodationId,
		checkInDate: '2999-07-20',
		checkOutDate: '2999-07-23',
		adults: 2,
		children: 0,
		expectedPricePerNightMinor: 8025,
		expectedLoyaltyBenefits: null
	});
	const onlineId = await member.mutation(createBooking, { ...request, paymentMethod: 'online' });
	const online = await t.run((ctx) => ctx.db.get('bookings', onlineId));
	expect(online!.cancellationTerms.loyaltyBenefits).toBeUndefined();
	expect(online!.cancellationTerms.stayPricing.totalMinor).toBe(24075);
	LOYALTY_CONFIG.BOOKING_ENABLED = false;
	const context = await member.query(
		api.tables.loyaltyMemberships.queries.fetchBookingBenefits.fetchBookingBenefits,
		{ accommodationId }
	);
	expect(context).toEqual({ level: 3, services: null, discountMode: null });
	const cashId = await member.mutation(createBooking, {
		...request,
		checkInDate: '2999-08-20',
		checkOutDate: '2999-08-23'
	});
	const cash = await t.run((ctx) => ctx.db.get('bookings', cashId));
	expect(cash!.cancellationTerms.loyaltyBenefits).toBeUndefined();
	expect(cash!.cancellationTerms.stayPricing.totalMinor).toBe(24075);
});

async function setup() {
	const t = convexTest(schema, modules);
	aggregateTest.register(t, 'bookingOwnerAggregate');
	rateLimiterTest.register(t);
	registerResend(t);
	t.registerComponent(
		'betterAuth',
		authSchema,
		import.meta.glob('../../src/convex/betterAuth/component/**/*.ts')
	);
	const host = await t.mutation(components.betterAuth.adapter.create, {
		input: {
			model: 'user',
			data: {
				name: 'Host',
				email: 'host@example.com',
				emailVerified: true,
				createdAt: Date.now(),
				updatedAt: Date.now()
			}
		}
	});
	testBackends.push(t);
	return { t, hostId: host._id };
}

const createBooking = api.tables.bookings.mutations.createBooking.createBooking;
const fetchHostBookings = api.tables.bookings.queries.fetchHostBookings.fetchHostBookings;
const updateBookingStatus = api.tables.bookings.mutations.updateBookingStatus.updateBookingStatus;
const hasPendingHostBookings =
	api.tables.bookings.queries.hasPendingHostBookings.hasPendingHostBookings;

const accommodation = {
	ownerId: 'host-1',
	name: 'Sunny apartment',
	description: 'A bright stay in the city center.',
	type: 'apartment' as const,
	spaceType: 'entire' as const,
	address: { street: 'Main', streetNumber: '12', city: 'Belgrade', country: 'Serbia' },
	latitude: 44.8,
	longitude: 20.4,
	maxGuests: 4,
	bedrooms: 2,
	beds: 3,
	bathrooms: 1,
	pricePerNightMinor: 8025,
	discountBps: 0,
	weekendPricePerNightMinor: null,
	effectivePricePerNightMinor: 8025,
	sameDayReservation: false,
	recommendationSortKey: -3,
	guestRatingAverage: 0,
	guestReviewCount: 0,
	amenities: [],
	imageKeys: [],
	checkInStart: '14:00',
	timeZone: 'Europe/Belgrade',
	checkInEnd: '20:00',
	checkOut: '11:00',
	minimumStay: 2,
	maximumStay: 30,
	smokingAllowed: false,
	petsAllowed: false,
	partiesAllowed: false,
	houseRules: '',
	cancellationPolicy: ACCOMMODATION_CONFIG.CANCELLATION_DEFAULT_POLICY,
	status: 'published' as const,
	updatedAt: Date.now()
};

const guest = {
	paymentMethod: 'cash' as const,
	firstName: ' Alex ',
	lastName: 'Guest',
	email: 'alex@example.com',
	phone: '+381 64 1234567',
	specialRequests: ''
};

test('requests freeze server-owned terms and confirmation preserves them after listing edits', async () => {
	const { t, hostId } = await setup();
	const accommodationId = await t.run((ctx) =>
		ctx.db.insert('accommodations', {
			...bookingFeeBilling,
			supportedPaymentMethods: 'cash',
			...accommodation,
			ownerId: hostId
		})
	);
	const request = {
		accommodationId,
		checkInDate: '2999-07-20',
		checkOutDate: '2999-07-23',
		adults: 2,
		children: 0,
		...guest
	};
	const id = await t.mutation(
		createBooking,
		withExpectedTotal({ ...request, expectedPricePerNightMinor: 8025 })
	);
	const stored = await t.run((ctx) => ctx.db.get('bookings', id));
	const original = stored?.cancellationTerms;
	const originalFee = stored?.platformFeeTerms;
	expect(originalFee).toEqual({
		model: 'booking_fee',
		commissionBps: 1000,
		baseAmountMinor: 24075,
		amountMinor: 2408,
		currency: 'EUR'
	});
	expect(original).toEqual({
		stayType: 'overnight',
		pricePerDayUseMinor: null,
		policy: ACCOMMODATION_CONFIG.CANCELLATION_DEFAULT_POLICY,
		timeZone: 'Europe/Belgrade',
		checkInStart: '14:00',
		checkInAt: Date.parse('2999-07-20T12:00:00Z'),
		checkOut: '11:00',
		checkOutAt: Date.parse('2999-07-23T09:00:00Z'),
		pricePerNightMinor: 8025,
		discountBps: 0,
		basePricePerNightMinor: 8025,
		stayPricing: {
			regularNights: 3,
			weekendNights: 0,
			weekendBasePricePerNightMinor: null,
			weekendPricePerNightMinor: null,
			totalMinor: 24075
		},
		currency: 'EUR'
	});
	const custom = {
		version: 1,
		mode: 'custom',
		fiveToSevenDays: 100,
		threeToFiveDays: 50,
		oneToThreeDays: 50,
		under24Hours: 0
	} as const;
	await t.run((ctx) =>
		ctx.db.patch('accommodations', accommodationId, {
			timeZone: 'America/New_York',
			checkInStart: '16:00',
			pricePerNightMinor: 9999,
			discountBps: 0,
			weekendPricePerNightMinor: null,
			effectivePricePerNightMinor: 9999,
			cancellationPolicy: custom,
			billingPlanId: 'free',
			billingTerms: { model: 'free' },
			billingPeriodEndsAt: null
		})
	);
	const host = t.withIdentity({ subject: hostId, tokenIdentifier: `issuer|${hostId}` });
	await host.mutation(updateBookingStatus, { id, status: 'confirmed' });
	expect((await t.run((ctx) => ctx.db.get('bookings', id)))?.cancellationTerms).toEqual(original);
	expect((await t.run((ctx) => ctx.db.get('bookings', id)))?.platformFeeTerms).toEqual(originalFee);
	const confirmation =
		api.tables.bookings.queries.fetchBookingConfirmation.fetchBookingConfirmation;
	expect((await t.query(confirmation, { id }))?.status).toBe('confirmed');
	expect((await t.query(confirmation, { id }))?.cancellationTerms).toEqual(original);
	// Reuse the dates after releasing the confirmed inventory.
	await host.mutation(updateBookingStatus, { id, status: 'cancelled' });
	const nextId = await t.mutation(
		createBooking,
		withExpectedTotal({ ...request, expectedPricePerNightMinor: 9999 })
	);
	expect((await t.run((ctx) => ctx.db.get('bookings', nextId)))?.platformFeeTerms).toEqual({
		model: 'free',
		commissionBps: 0,
		baseAmountMinor: 29997,
		amountMinor: 0,
		currency: 'EUR'
	});
	expect((await t.run((ctx) => ctx.db.get('bookings', nextId)))?.cancellationTerms).toEqual({
		stayType: 'overnight',
		pricePerDayUseMinor: null,
		policy: custom,
		timeZone: 'America/New_York',
		checkInStart: '16:00',
		checkInAt: Date.parse('2999-07-20T20:00:00Z'),
		checkOut: '11:00',
		checkOutAt: Date.parse('2999-07-23T15:00:00Z'),
		pricePerNightMinor: 9999,
		discountBps: 0,
		basePricePerNightMinor: 9999,
		stayPricing: {
			regularNights: 3,
			weekendNights: 0,
			weekendBasePricePerNightMinor: null,
			weekendPricePerNightMinor: null,
			totalMinor: 29997
		},
		currency: 'EUR'
	});
	const forged = { ...request, cancellationTerms: original };
	await expect(
		t.mutation(createBooking, withExpectedTotal({ ...forged, expectedPricePerNightMinor: 9999 }))
	).rejects.toThrow();
});

test('requests reject unknown property timezones, elapsed check-in, and DST gaps or folds', async () => {
	vi.useFakeTimers();
	try {
		vi.setSystemTime(new Date('2027-01-01T12:00:00Z'));
		for (const [changes, checkInDate, code] of [
			[{ timeZone: 'Not/AZone' }, '2027-01-20', 'BOOKING_TERMS_UNAVAILABLE'],
			[{ checkInStart: '02:30' }, '2027-03-28', 'BOOKING_CHECK_IN_TIME_UNAVAILABLE'],
			[{ checkInStart: '02:30' }, '2027-10-31', 'BOOKING_CHECK_IN_TIME_UNAVAILABLE'],
			[{ checkOut: '02:30' }, '2027-03-25', 'BOOKING_CHECK_OUT_TIME_UNAVAILABLE'],
			[{ checkOut: '02:30' }, '2027-10-28', 'BOOKING_CHECK_OUT_TIME_UNAVAILABLE'],
			[{ checkInStart: '13:00', sameDayReservation: true }, '2027-01-01', 'BOOKING_START_PASSED']
		] as const) {
			const { t, hostId } = await setup();
			const accommodationId = await t.run((ctx) =>
				ctx.db.insert('accommodations', {
					...bookingFeeBilling,
					supportedPaymentMethods: 'cash',
					...accommodation,
					ownerId: hostId,
					...changes
				})
			);
			await expect(
				t.mutation(
					createBooking,
					withExpectedTotal({
						expectedPricePerNightMinor: 8025,
						...guest,
						accommodationId,
						checkInDate,
						checkOutDate: new Date(Date.parse(checkInDate) + 3 * 86_400_000)
							.toISOString()
							.slice(0, 10),
						adults: 1,
						children: 0
					})
				)
			).rejects.toMatchObject({ data: { code } });
			expect(await t.run((ctx) => ctx.db.query('bookings').take(1))).toEqual([]);
		}
	} finally {
		vi.useRealTimers();
	}
});

test('request dates use the property calendar even when its date differs from UTC', async () => {
	vi.useFakeTimers();
	try {
		vi.setSystemTime(new Date('2027-01-02T00:30:00Z'));
		const { t, hostId } = await setup();
		const accommodationId = await t.run((ctx) =>
			ctx.db.insert('accommodations', {
				...bookingFeeBilling,
				supportedPaymentMethods: 'cash',
				...accommodation,
				ownerId: hostId,
				timeZone: 'America/Los_Angeles',
				sameDayReservation: true,
				checkInStart: '17:00'
			})
		);
		const id = await t.mutation(
			createBooking,
			withExpectedTotal({
				expectedPricePerNightMinor: 8025,
				...guest,
				accommodationId,
				checkInDate: '2027-01-01',
				checkOutDate: '2027-01-04',
				adults: 1,
				children: 0
			})
		);
		expect((await t.run((ctx) => ctx.db.get('bookings', id)))?.cancellationTerms?.checkInAt).toBe(
			Date.parse('2027-01-02T01:00:00Z')
		);
	} finally {
		vi.useRealTimers();
	}
});

test('host bookings prioritize the oldest pending requests and the newest other statuses', async () => {
	const { t, hostId } = await setup();
	const accommodationId = await t.run((ctx) =>
		ctx.db.insert('accommodations', {
			...bookingFeeBilling,
			supportedPaymentMethods: 'cash',
			...accommodation,
			ownerId: hostId
		})
	);
	const host = t.withIdentity({ subject: hostId, tokenIdentifier: `issuer|${hostId}` });
	vi.useFakeTimers();
	try {
		const insert = (status: 'pending' | 'confirmed', checkInDate: string, bookingHostId = hostId) =>
			t.run((ctx) =>
				ctx.db.insert('bookings', {
					platformFeeTerms: null,
					cancellationTerms: bookingCancellationTerms(checkInDate, '2999-12-31'),
					...guest,
					firstName: 'Alex',
					accommodationId,
					hostId: bookingHostId,
					status,
					checkInDate,
					checkOutDate: '2999-12-31',
					adults: 2,
					children: 0,
					searchText: 'guest alex@example.com'
				})
			);
		vi.setSystemTime(new Date('2026-09-01T10:00:00Z'));
		const oldest = await insert('pending', '2999-11-01');
		vi.setSystemTime(new Date('2026-09-02T10:00:00Z'));
		const newest = await insert('pending', '2999-10-01');
		vi.setSystemTime(new Date('2026-09-03T10:00:00Z'));
		const far = await insert('confirmed', '2026-11-01');
		vi.setSystemTime(new Date('2026-09-04T10:00:00Z'));
		const past = await insert('confirmed', '2026-09-01');
		vi.setSystemTime(new Date('2026-09-05T10:00:00Z'));
		const near = await insert('confirmed', '2026-10-01');
		vi.setSystemTime(new Date('2026-09-06T10:00:00Z'));
		await insert('confirmed', '2026-09-30', 'host-2');

		const pending = await host.query(fetchHostBookings, {
			paginationOpts: { cursor: null, numItems: 10 },
			filters: { status: 'pending' }
		});
		expect(pending.items.map((item) => item._id)).toEqual([oldest, newest]);

		const newestPending = await host.query(fetchHostBookings, {
			paginationOpts: { cursor: null, numItems: 10 },
			filters: { status: 'pending' },
			sort: 'newest'
		});
		expect(newestPending.items.map((item) => item._id)).toEqual([newest, oldest]);
		const ids: string[] = [];
		let cursor: string | null = null;
		for (let pageNumber = 0; pageNumber < 6; pageNumber++) {
			const page: { items: { _id: string }[]; nextCursor: string | null } = await host.query(
				fetchHostBookings,
				{
					paginationOpts: { cursor, numItems: 1 },
					filters: { status: 'confirmed' }
				}
			);
			ids.push(...page.items.map((item) => item._id));
			cursor = page.nextCursor;
			if (cursor === null) break;
		}
		expect(ids).toEqual([near, past, far]);
		expect(cursor).toBeNull();
	} finally {
		vi.useRealTimers();
	}
});

test('createBooking stores a guest request and rejects invalid stays and missing accommodations', async () => {
	const { t, hostId } = await setup();
	const accommodationId = await t.run((ctx) =>
		ctx.db.insert('accommodations', {
			...bookingFeeBilling,
			supportedPaymentMethods: 'cash',
			...accommodation,
			ownerId: hostId
		})
	);

	await expect(
		t.mutation(
			createBooking,
			withExpectedTotal({
				expectedPricePerNightMinor: 8025,
				accommodationId,
				checkInDate: '2999-10-24',
				checkOutDate: '2999-10-25',
				adults: 2,
				children: 0,
				...guest
			})
		)
	).rejects.toMatchObject({ data: { code: 'INVALID_BOOKING' } });

	await t.mutation(
		createBooking,
		withExpectedTotal({
			expectedPricePerNightMinor: 8025,
			accommodationId,
			checkInDate: '2999-10-24',
			checkOutDate: '2999-10-27',
			adults: 2,
			children: 1,
			...guest,
			email: ' Alex@Example.COM '
		})
	);

	const stored = await t.run((ctx) => ctx.db.query('bookings').take(10));
	expect(stored).toHaveLength(1);
	expect(stored[0]).toMatchObject({
		accommodationId,
		checkInDate: '2999-10-24',
		checkOutDate: '2999-10-27',
		adults: 2,
		children: 1,
		firstName: 'Alex',
		lastName: 'Guest',
		email: 'alex@example.com',
		status: 'pending',
		searchText: 'guest alex@example.com'
	});
	expect(stored[0].ownerId).toBeUndefined();
	expect(stored[0].hostId).toBe(hostId);
	expect(stored[0].specialRequests).toBeUndefined();

	const missingId = await t.run(async (ctx) => {
		const id = await ctx.db.insert('accommodations', {
			...bookingFeeBilling,
			supportedPaymentMethods: 'cash',
			...accommodation,
			ownerId: hostId
		});
		await ctx.db.delete(id);
		return id;
	});
	await expect(
		t.mutation(
			createBooking,
			withExpectedTotal({
				expectedPricePerNightMinor: 8025,
				accommodationId: missingId,
				checkInDate: '2999-10-24',
				checkOutDate: '2999-10-27',
				adults: 2,
				children: 0,
				...guest
			})
		)
	).rejects.toMatchObject({ data: { code: 'ACCOMMODATION_NOT_FOUND' } });
});

test('signed-in guests own their booking and see it in my-bookings with the owner total', async () => {
	const { t, hostId } = await setup();
	const accommodationId = await t.run((ctx) =>
		ctx.db.insert('accommodations', {
			...bookingFeeBilling,
			supportedPaymentMethods: 'cash',
			...accommodation,
			ownerId: hostId
		})
	);
	const signedInGuest = t.withIdentity({ subject: 'guest-1', tokenIdentifier: 'issuer|guest-1' });

	const bookingId = await signedInGuest.mutation(
		createBooking,
		withExpectedTotal({
			expectedPricePerNightMinor: 8025,
			accommodationId,
			checkInDate: '2999-10-24',
			checkOutDate: '2999-10-27',
			adults: 2,
			children: 0,
			...guest
		})
	);

	const fetchMyBookings = api.tables.bookings.queries.fetchMyBookings.fetchMyBookings;
	const page = await signedInGuest.query(fetchMyBookings, {
		paginationOpts: { cursor: null, numItems: 10 }
	});
	expect(page.items).toHaveLength(1);
	expect(page.items[0]).toMatchObject({ _id: bookingId, ownerId: 'guest-1', status: 'pending' });
	expect(page.items[0].accommodation).toEqual({
		name: 'Sunny apartment',
		city: 'Belgrade',
		country: 'Serbia',
		imageUrl: null
	});

	const anotherGuest = t.withIdentity({ subject: 'guest-2', tokenIdentifier: 'issuer|guest-2' });
	const otherPage = await anotherGuest.query(fetchMyBookings, {
		paginationOpts: { cursor: null, numItems: 10 }
	});
	expect(otherPage.items).toEqual([]);

	await t.run((ctx) => ctx.db.patch(accommodationId, { imageKeys: ['stays/cover.jpg'] }));
	const withCover = await signedInGuest.query(fetchMyBookings, {
		paginationOpts: { cursor: null, numItems: 10 }
	});
	expect(withCover.items[0].accommodation?.imageUrl).toBe(
		'https://cdn.example.com/stays/cover.jpg'
	);
	expect(withCover.items[0].accommodation).not.toHaveProperty('ownerId');
	expect(withCover.items[0].accommodation).not.toHaveProperty('imageKeys');

	await t.run((ctx) => ctx.db.delete(accommodationId));
	const withoutListing = await signedInGuest.query(fetchMyBookings, {
		paginationOpts: { cursor: null, numItems: 10 }
	});
	expect(withoutListing.items).toHaveLength(1);
	expect(withoutListing.items[0]).toMatchObject({ _id: bookingId, accommodation: null });

	await expect(
		t.query(fetchMyBookings, { paginationOpts: { cursor: null, numItems: 10 } })
	).rejects.toMatchObject({ data: { code: 'UNAUTHENTICATED' } });
});

test('host manages bookings for their own accommodations', async () => {
	const { t, hostId } = await setup();
	const accommodationId = await t.run((ctx) =>
		ctx.db.insert('accommodations', {
			...bookingFeeBilling,
			supportedPaymentMethods: 'cash',
			...accommodation,
			ownerId: hostId
		})
	);
	const host = t.withIdentity({ subject: hostId, tokenIdentifier: `issuer|${hostId}` });
	const stranger = t.withIdentity({ subject: 'host-2', tokenIdentifier: 'issuer|host-2' });
	expect(await host.query(hasPendingHostBookings, {})).toBe(false);
	await expect(t.query(hasPendingHostBookings, {})).rejects.toMatchObject({
		data: { code: 'UNAUTHENTICATED' }
	});

	const bookingId = await t.mutation(
		createBooking,
		withExpectedTotal({
			expectedPricePerNightMinor: 8025,
			accommodationId,
			checkInDate: '2999-10-24',
			checkOutDate: '2999-10-27',
			adults: 2,
			children: 0,
			...guest
		})
	);

	const base = { paginationOpts: { cursor: null, numItems: 10 } };
	expect(await host.query(hasPendingHostBookings, {})).toBe(true);
	expect(await stranger.query(hasPendingHostBookings, {})).toBe(false);
	expect(
		(await host.query(fetchHostBookings, { ...base, filters: { status: 'pending' } })).items
	).toHaveLength(1);
	const page = await host.query(fetchHostBookings, base);
	expect(page.items).toHaveLength(1);
	expect(page.items[0]).toMatchObject({ _id: bookingId, hostId: hostId, status: 'pending' });

	expect((await stranger.query(fetchHostBookings, base)).items).toEqual([]);
	await expect(
		stranger.mutation(updateBookingStatus, { id: bookingId, status: 'confirmed' })
	).rejects.toMatchObject({ data: { code: 'BOOKING_NOT_FOUND' } });

	await host.mutation(updateBookingStatus, { id: bookingId, status: 'confirmed' });
	expect(await host.query(hasPendingHostBookings, {})).toBe(false);
	expect(
		(await host.query(fetchHostBookings, { ...base, filters: { status: 'pending' } })).items
	).toEqual([]);
	const confirmed = await host.query(fetchHostBookings, {
		...base,
		filters: { status: 'confirmed' }
	});
	expect(confirmed.items).toHaveLength(1);

	await expect(
		host.mutation(updateBookingStatus, { id: bookingId, status: 'declined' })
	).rejects.toMatchObject({ data: { code: 'INVALID_BOOKING_STATUS' } });

	await expect(
		host.mutation(updateBookingStatus, { id: bookingId, status: 'completed' })
	).rejects.toMatchObject({ data: { code: 'BOOKING_NOT_FINISHED' } });
	await t.run((ctx) =>
		ctx.db.patch(bookingId, {
			checkInDate: '2020-10-24',
			checkOutDate: '2020-10-27',
			cancellationTerms: bookingCancellationTerms('2020-10-24', '2020-10-27')
		})
	);
	await host.mutation(updateBookingStatus, { id: bookingId, status: 'completed' });
	expect((await t.run((ctx) => ctx.db.get(bookingId)))?.completedAt).toBeTypeOf('number');
	await expect(
		host.mutation(updateBookingStatus, { id: bookingId, status: 'cancelled' })
	).rejects.toMatchObject({ data: { code: 'INVALID_BOOKING_STATUS' } });

	const search = await host.query(fetchHostBookings, { ...base, search: 'guest' });
	expect(search.items).toHaveLength(1);

	await expect(t.query(fetchHostBookings, base)).rejects.toMatchObject({
		data: { code: 'UNAUTHENTICATED' }
	});
});

test('arrival today is opt-in, ends exactly at check-in, and still respects minimum nights', async () => {
	vi.setSystemTime(new Date('2027-01-01T10:00:00Z'));
	const { t, hostId } = await setup();
	const accommodationId = await t.run((ctx) =>
		ctx.db.insert('accommodations', {
			...bookingFeeBilling,
			supportedPaymentMethods: 'cash',
			...accommodation,
			ownerId: hostId
		})
	);
	const request = {
		...guest,
		accommodationId,
		checkInDate: '2027-01-01',
		checkOutDate: '2027-01-04',
		adults: 1,
		children: 0
	};
	await expect(
		t.mutation(createBooking, withExpectedTotal({ ...request, expectedPricePerNightMinor: 8025 }))
	).rejects.toMatchObject({
		data: { code: 'SAME_DAY_RESERVATION_DISABLED' }
	});
	await t.run((ctx) =>
		ctx.db.patch('accommodations', accommodationId, { sameDayReservation: true })
	);
	await expect(
		t.mutation(
			createBooking,
			withExpectedTotal({
				expectedPricePerNightMinor: 8025,
				...request,
				checkOutDate: '2027-01-02'
			})
		)
	).rejects.toMatchObject({ data: { code: 'INVALID_BOOKING' } });
	const id = await t.mutation(
		createBooking,
		withExpectedTotal({ ...request, expectedPricePerNightMinor: 8025 })
	);
	expect((await t.run((ctx) => ctx.db.get('bookings', id)))?.requestExpiresAt).toBe(
		Date.parse('2027-01-01T13:00:00Z')
	);
	vi.setSystemTime(new Date('2027-01-01T13:00:00Z'));
	await expect(
		t.mutation(createBooking, withExpectedTotal({ ...request, expectedPricePerNightMinor: 8025 }))
	).rejects.toMatchObject({
		data: { code: 'BOOKING_START_PASSED' }
	});
	const host = t.withIdentity({ subject: hostId, tokenIdentifier: 'issuer|' + hostId });
	await expect(
		host.mutation(updateBookingStatus, { id, status: 'confirmed' })
	).rejects.toMatchObject({ data: { code: 'BOOKING_REQUEST_EXPIRED' } });
});

test.each(['request', 'instant'] as const)(
	'new bookings require overnight dates even for arrivals today (%s)',
	async (bookingMode) => {
		vi.setSystemTime(new Date('2027-01-01T07:00:00Z'));
		const { t, hostId } = await setup();
		const accommodationId = await t.run((ctx) =>
			ctx.db.insert('accommodations', {
				...bookingFeeBilling,
				supportedPaymentMethods: 'cash',
				...accommodation,
				ownerId: hostId,
				bookingMode,
				sameDayReservation: true,
				minimumStay: 1
			})
		);
		const request = {
			...guest,
			accommodationId,
			expectedBookingMode: bookingMode,
			checkInDate: '2027-01-01',
			checkOutDate: '2027-01-01',
			adults: 1,
			children: 0
		};
		await expect(
			t.mutation(createBooking, withExpectedTotal({ ...request, expectedPricePerNightMinor: 8025 }))
		).rejects.toMatchObject({
			data: { code: 'INVALID_BOOKING' }
		});
		await expect(
			t.mutation(
				createBooking,
				withExpectedTotal({
					expectedPricePerNightMinor: 8025,
					...request,
					checkInDate: '2027-01-10',
					checkOutDate: '2027-01-10'
				})
			)
		).rejects.toMatchObject({ data: { code: 'INVALID_BOOKING' } });
		const id = await t.mutation(
			createBooking,
			withExpectedTotal({
				expectedPricePerNightMinor: 8025,
				...request,
				checkOutDate: '2027-01-02'
			})
		);
		expect(await t.run((ctx) => ctx.db.get('bookings', id))).toMatchObject({
			status: bookingMode === 'instant' ? 'confirmed' : 'pending',
			cancellationTerms: { stayType: 'overnight', pricePerDayUseMinor: null }
		});
	}
);

test('historical daytime bookings retain frozen terms and block overlapping new overnight bookings', async () => {
	vi.setSystemTime(new Date('2027-01-01T07:00:00Z'));
	const { t, hostId } = await setup();
	const accommodationId = await t.run((ctx) =>
		ctx.db.insert('accommodations', {
			...bookingFeeBilling,
			supportedPaymentMethods: 'cash',
			...accommodation,
			ownerId: hostId
		})
	);
	const terms = {
		...bookingCancellationTerms('2027-01-10', '2027-01-10'),
		stayType: 'day_use' as const,
		pricePerDayUseMinor: 3525,
		checkInStart: '10:00',
		checkOut: '18:00',
		checkInAt: Date.parse('2027-01-10T09:00:00Z'),
		checkOutAt: Date.parse('2027-01-10T17:00:00Z')
	};
	const id = await t.run((ctx) =>
		ctx.db.insert('bookings', {
			platformFeeTerms: null,
			...guest,
			accommodationId,
			hostId,
			firstName: 'Alex',
			status: 'pending',
			checkInDate: '2027-01-10',
			checkOutDate: '2027-01-10',
			adults: 1,
			children: 0,
			requestExpiresAt: Date.parse('2027-01-02T07:00:00Z'),
			cancellationTerms: terms
		})
	);
	const host = t.withIdentity({ subject: hostId, tokenIdentifier: 'issuer|' + hostId });
	await host.mutation(updateBookingStatus, { id, status: 'confirmed' });
	expect((await t.run((ctx) => ctx.db.get('bookings', id)))?.cancellationTerms).toEqual(terms);
	await expect(
		t.mutation(
			createBooking,
			withExpectedTotal({
				expectedPricePerNightMinor: 8025,
				...guest,
				accommodationId,
				checkInDate: '2027-01-10',
				checkOutDate: '2027-01-13',
				adults: 1,
				children: 0
			})
		)
	).rejects.toMatchObject({ data: { code: 'BOOKING_DATES_UNAVAILABLE' } });
});

test.each([
	['cash', 'cash'],
	['online', 'online'],
	['both', 'cash'],
	['both', 'online']
] as const)(
	'records %s listing payment choice %s and preserves it after listing changes',
	async (supportedPaymentMethods, paymentMethod) => {
		const { t, hostId } = await setup();
		const accommodationId = await t.run((ctx) =>
			ctx.db.insert('accommodations', {
				...bookingFeeBilling,
				...accommodation,
				ownerId: hostId,
				supportedPaymentMethods
			})
		);
		const request = {
			accommodationId,
			checkInDate: '2999-07-20',
			checkOutDate: '2999-07-23',
			adults: 2,
			children: 0,
			...guest
		};
		if (supportedPaymentMethods !== 'both') {
			await expect(
				t.mutation(
					createBooking,
					withExpectedTotal({
						expectedPricePerNightMinor: 8025,
						...request,
						paymentMethod: paymentMethod === 'cash' ? 'online' : 'cash'
					})
				)
			).rejects.toThrow('PAYMENT_METHOD_UNSUPPORTED');
		}
		const bookingId = await t.mutation(
			createBooking,
			withExpectedTotal({
				expectedPricePerNightMinor: 8025,
				...request,
				paymentMethod
			})
		);
		await t.run((ctx) =>
			ctx.db.patch('accommodations', accommodationId, {
				supportedPaymentMethods: paymentMethod === 'cash' ? 'online' : 'cash'
			})
		);
		expect((await t.run((ctx) => ctx.db.get('bookings', bookingId)))?.paymentMethod).toBe(
			paymentMethod
		);
		expect(
			(
				await t.query(
					api.tables.bookings.queries.fetchBookingConfirmation.fetchBookingConfirmation,
					{ id: bookingId }
				)
			)?.paymentMethod
		).toBe(paymentMethod);
	}
);

test('discounted bookings reject stale prices and preserve the accepted nightly rate', async () => {
	const { t, hostId } = await setup();
	const accommodationId = await t.run((ctx) =>
		ctx.db.insert('accommodations', {
			...bookingFeeBilling,
			...accommodation,
			ownerId: hostId,
			supportedPaymentMethods: 'cash',
			discountBps: 1500,
			weekendPricePerNightMinor: null,
			effectivePricePerNightMinor: 6821
		})
	);
	const request = {
		...guest,
		accommodationId,
		checkInDate: '2999-07-20',
		checkOutDate: '2999-07-23',
		adults: 1,
		children: 0
	};
	await expect(
		t.mutation(createBooking, withExpectedTotal({ ...request, expectedPricePerNightMinor: 8025 }))
	).rejects.toThrow('BOOKING_PRICE_CHANGED');
	const id = await t.mutation(
		createBooking,
		withExpectedTotal({ ...request, expectedPricePerNightMinor: 6821 })
	);
	await t.run((ctx) =>
		ctx.db.patch('accommodations', accommodationId, {
			discountBps: 0,
			weekendPricePerNightMinor: null,
			effectivePricePerNightMinor: 8025
		})
	);
	expect((await t.run((ctx) => ctx.db.get('bookings', id)))?.cancellationTerms).toMatchObject({
		basePricePerNightMinor: 8025,
		discountBps: 1500,
		pricePerNightMinor: 6821
	});
});

test('weekend bookings reject stale totals and freeze the discounted mixed-night quote', async () => {
	const { t, hostId } = await setup();
	const accommodationId = await t.run((ctx) =>
		ctx.db.insert('accommodations', {
			...bookingFeeBilling,
			...accommodation,
			ownerId: hostId,
			supportedPaymentMethods: 'cash',
			discountBps: 1500,
			effectivePricePerNightMinor: 6821,
			weekendPricePerNightMinor: 10025
		})
	);
	const request = {
		...guest,
		accommodationId,
		checkInDate: '2999-07-19',
		checkOutDate: '2999-07-22',
		adults: 1,
		children: 0,
		expectedPricePerNightMinor: 6821
	};
	// 2999-07-19 is Friday: two weekend nights and one regular night.
	await expect(
		t.mutation(createBooking, { ...request, expectedTotalMinor: 20463 })
	).rejects.toThrow('BOOKING_PRICE_CHANGED');
	const id = await t.mutation(createBooking, { ...request, expectedTotalMinor: 23863 });
	const original = (await t.run((ctx) => ctx.db.get('bookings', id)))?.cancellationTerms;
	expect(original?.stayPricing).toEqual({
		regularNights: 1,
		weekendNights: 2,
		weekendBasePricePerNightMinor: 10025,
		weekendPricePerNightMinor: 8521,
		totalMinor: 23863
	});
	await t.run((ctx) =>
		ctx.db.patch('accommodations', accommodationId, { weekendPricePerNightMinor: 20000 })
	);
	await expect(
		t.mutation(createBooking, { ...request, expectedTotalMinor: 23863 })
	).rejects.toThrow('BOOKING_PRICE_CHANGED');
	expect((await t.run((ctx) => ctx.db.get('bookings', id)))?.cancellationTerms).toEqual(original);
});
