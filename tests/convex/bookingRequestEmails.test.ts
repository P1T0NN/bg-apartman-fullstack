import { registerResend, successfulResendResponse, emailStatuses } from '../fixtures/resend';
/// <reference types="vite/client" />
import { convexTest } from 'convex-test';
import aggregateTest from '@convex-dev/aggregate/test';
import rateLimiterTest from '@convex-dev/rate-limiter/test';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { api, components, internal } from '../../src/convex/_generated/api';
import schema, { tables } from '../../src/convex/schema';
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { bookings } from '../../src/convex/tables/bookings/schema';
import authSchema from '../../src/convex/betterAuth/component/schema';
import { ACCOMMODATION_CONFIG } from '../../src/shared/features/accommodations/config';
import { BOOKINGS_CONFIG } from '../../src/shared/features/bookings/config';
import { calculateBookingRequestExpiry } from '../../src/shared/features/bookings/utils/calculateBookingRequestExpiry';
import {
	bookingCancellationTerms,
	withExpectedTotal
} from '../fixtures/bookingCancellationTerms.js';

const modules = import.meta.glob('../../src/convex/**/*.ts');
const create = api.tables.bookings.mutations.createBooking.createBooking;
const updateStatus = api.tables.bookings.mutations.updateBookingStatus.updateBookingStatus;
const expire = internal.tables.bookings.crons.expireBookingRequestsCron.expireBookingRequestsCron;
const blockDates = api.tables.accommodationBlockedDates.mutations.blockDates.blockDates;
const unblockDates = api.tables.accommodationBlockedDates.mutations.unblockDates.unblockDates;
const publicCalendar =
	api.tables.accommodations.queries.fetchPublicAccommodation.fetchPublicAccommodation;
const hostCalendar =
	api.tables.accommodationBlockedDates.queries.fetchMyAccommodationCalendar
		.fetchMyAccommodationCalendar;

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

beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(new Date('2026-10-01T12:00:00Z'));
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

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllEnvs();
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

async function setup() {
	const t = convexTest(schema, modules);
	registerResend(t);
	rateLimiterTest.register(t);
	aggregateTest.register(t, 'bookingOwnerAggregate');
	aggregateTest.register(t, 'reviewsAggregate');
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
	const accommodationId = await t.run((ctx) =>
		ctx.db.insert('accommodations', {
			supportedPaymentMethods: 'cash',
			...accommodation,
			ownerId: host._id
		})
	);
	const args = {
		expectedPricePerNightMinor: 8025,
		paymentMethod: 'cash' as const,
		accommodationId,
		checkInDate: '2026-11-01',
		checkOutDate: '2026-11-05',
		adults: 2,
		children: 1,
		firstName: ' Alex ',
		lastName: ' Guest ',
		email: ' GUEST@EXAMPLE.COM ',
		phone: '+381 64 1234567',
		specialRequests: 'Late arrival'
	};
	const drain = () => t.finishAllScheduledFunctions(() => vi.runAllTimersAsync());
	return { t, host, accommodationId, args, drain };
}

function emails() {
	return vi.mocked(fetch).mock.calls.flatMap(([, options]) =>
		JSON.parse(String(options?.body)).map((message: { to: string[] }) => ({
			...message,
			to: message.to[0]
		}))
	);
}

test('manual blocks allow exactly 30 inclusive nights, are idempotent, and support partial unblocking', async () => {
	const { t, host, accommodationId } = await setup();
	const owner = t.withIdentity({ subject: host._id });
	const range = { accommodationId, startDate: '2026-11-01', lastDate: '2026-11-30' };
	await owner.mutation(blockDates, range);
	await owner.mutation(blockDates, range);
	expect(await t.run((ctx) => ctx.db.query('accommodationBlockedDates').collect())).toHaveLength(
		30
	);
	await owner.mutation(unblockDates, { ...range, startDate: '2026-11-10', lastDate: '2026-11-12' });
	await owner.mutation(unblockDates, { ...range, startDate: '2026-11-10', lastDate: '2026-11-12' });
	const dates = await t.run((ctx) => ctx.db.query('accommodationBlockedDates').collect());
	expect(dates).toHaveLength(27);
	expect(dates.map((row) => row.date)).not.toContain('2026-11-11');
	expect(dates.map((row) => row.date)).toContain('2026-11-30');
	await owner.mutation(blockDates, {
		accommodationId,
		startDate: '2026-12-01',
		lastDate: '2026-12-30'
	});
	expect(await t.run((ctx) => ctx.db.query('accommodationBlockedDates').collect())).toHaveLength(
		57
	);
});

test.each([
	['2026-11-01', '2026-12-01'], // 31 inclusive nights
	['2026-11-05', '2026-11-01'],
	['2026-02-30', '2026-03-01'],
	['2026-09-30', '2026-10-01']
])(
	'blocking and unblocking reject invalid ranges %s–%s without writes',
	async (startDate, lastDate) => {
		const { t, host, accommodationId } = await setup();
		const owner = t.withIdentity({ subject: host._id });
		for (const mutation of [blockDates, unblockDates]) {
			await expect(
				owner.mutation(mutation, { accommodationId, startDate, lastDate })
			).rejects.toMatchObject({ data: { code: 'INVALID_BLOCKED_DATE_RANGE' } });
		}
		expect(await t.run((ctx) => ctx.db.query('accommodationBlockedDates').collect())).toEqual([]);
	}
);

test('manual blocks and the private calendar enforce listing ownership', async () => {
	const { t, accommodationId } = await setup();
	const stranger = t.withIdentity({ subject: 'stranger' });
	const args = { accommodationId, startDate: '2026-11-01', lastDate: '2026-11-01' };
	for (const mutation of [blockDates, unblockDates]) {
		await expect(t.mutation(mutation, args)).rejects.toMatchObject({
			data: { code: 'UNAUTHENTICATED' }
		});
		await expect(stranger.mutation(mutation, args)).rejects.toMatchObject({
			data: { code: 'FORBIDDEN' }
		});
	}
	await expect(
		stranger.query(hostCalendar, {
			accommodationId
		})
	).rejects.toMatchObject({ data: { code: 'FORBIDDEN' } });
});

test.each(['request', 'instant'] as const)(
	'blocked nights reject %s bookings but allow checkout on the blocked date',
	async (bookingMode) => {
		const { t, host, accommodationId, args, drain } = await setup();
		await t.run((ctx) => ctx.db.patch('accommodations', accommodationId, { bookingMode }));
		const owner = t.withIdentity({ subject: host._id });
		await owner.mutation(blockDates, {
			accommodationId,
			startDate: '2026-11-03',
			lastDate: '2026-11-03'
		});
		await expect(
			t.mutation(create, withExpectedTotal({ ...args, expectedBookingMode: bookingMode }))
		).rejects.toMatchObject({ data: { code: 'BOOKING_DATES_UNAVAILABLE' } });
		const id = await t.mutation(
			create,
			withExpectedTotal({
				...args,
				checkOutDate: '2026-11-03',
				expectedBookingMode: bookingMode
			})
		);
		expect((await t.run((ctx) => ctx.db.get('bookings', id)))?.checkOutDate).toBe('2026-11-03');
		await drain();
	}
);

test('blocking confirmed nights fails atomically and unblocking cannot remove the booking', async () => {
	const { t, host, accommodationId, args, drain } = await setup();
	await t.run((ctx) => ctx.db.patch('accommodations', accommodationId, { bookingMode: 'instant' }));
	const id = await t.mutation(
		create,
		withExpectedTotal({ ...args, expectedBookingMode: 'instant' })
	);
	const owner = t.withIdentity({ subject: host._id });
	await expect(
		owner.mutation(blockDates, { accommodationId, startDate: '2026-10-31', lastDate: '2026-11-02' })
	).rejects.toMatchObject({ data: { code: 'BLOCKED_DATES_BOOKING_CONFLICT' } });
	expect(await t.run((ctx) => ctx.db.query('accommodationBlockedDates').collect())).toEqual([]);
	await owner.mutation(unblockDates, {
		accommodationId,
		startDate: '2026-11-01',
		lastDate: '2026-11-04'
	});
	expect((await t.run((ctx) => ctx.db.get('bookings', id)))?.status).toBe('confirmed');
	await owner.mutation(blockDates, {
		accommodationId,
		startDate: '2026-11-05',
		lastDate: '2026-11-05'
	});
	await drain();
});

test('blocking warns about pending requests and prevents confirmation until unblocked', async () => {
	const { t, host, accommodationId, args, drain } = await setup();
	const id = await t.mutation(create, withExpectedTotal(args));
	const owner = t.withIdentity({ subject: host._id });
	const range = { accommodationId, startDate: '2026-11-02', lastDate: '2026-11-02' };
	expect(await owner.mutation(blockDates, range)).toEqual({ pendingRequests: 1 });
	await expect(owner.mutation(updateStatus, { id, status: 'confirmed' })).rejects.toMatchObject({
		data: { code: 'BOOKING_DATES_UNAVAILABLE' }
	});
	expect((await t.run((ctx) => ctx.db.get('bookings', id)))?.status).toBe('pending');
	await owner.mutation(unblockDates, range);
	await owner.mutation(updateStatus, { id, status: 'confirmed' });
	expect((await t.run((ctx) => ctx.db.get('bookings', id)))?.status).toBe('confirmed');
	await drain();
});

test('calendar returns real occupancy without guest details and rejects incomplete reads', async () => {
	const { t, host, accommodationId, args, drain } = await setup();
	const owner = t.withIdentity({ subject: host._id });
	await owner.mutation(blockDates, {
		accommodationId,
		startDate: '2026-11-10',
		lastDate: '2026-11-11'
	});
	await t.run((ctx) => ctx.db.patch('accommodations', accommodationId, { bookingMode: 'instant' }));
	await t.mutation(create, withExpectedTotal({ ...args, expectedBookingMode: 'instant' }));
	const expected = {
		blockedDates: ['2026-11-10', '2026-11-11'],
		bookings: [{ checkInDate: args.checkInDate, checkOutDate: args.checkOutDate }]
	};
	const publicResult = await t.query(publicCalendar, { id: accommodationId });
	expect(publicResult?.availability).toEqual(expected);
	expect(publicResult).not.toHaveProperty('ownerId');
	expect(await owner.query(hostCalendar, { accommodationId })).toEqual({
		...expected,
		pricing: { pricePerNightMinor: 8025, discountBps: 0, weekendPricePerNightMinor: null }
	});
	await t.run(async (ctx) => {
		// Duplicate corruption must never be silently truncated into apparently available dates.
		for (let index = 0; index <= BOOKINGS_CONFIG.AVAILABILITY_CHECK_LIMIT; index++)
			await ctx.db.insert('accommodationBlockedDates', { accommodationId, date: '2026-11-10' });
	});
	await expect(t.query(publicCalendar, { id: accommodationId })).rejects.toMatchObject({
		data: { code: 'BOOKING_AVAILABILITY_UNAVAILABLE' }
	});
	await drain();
});

test('checkout availability rejects unpublished listings while the owner calendar remains accessible', async () => {
	const { t, host, accommodationId } = await setup();
	const owner = t.withIdentity({ subject: host._id });
	await t.run((ctx) => ctx.db.patch('accommodations', accommodationId, { status: 'unpublished' }));
	expect(await t.query(publicCalendar, { id: accommodationId })).toBeNull();
	expect(await owner.query(hostCalendar, { accommodationId })).toEqual({
		blockedDates: [],
		bookings: [],
		pricing: { pricePerNightMinor: 8025, discountBps: 0, weekendPricePerNightMinor: null }
	});
});

test('blocking uses the property-local date and counts calendar nights across daylight saving changes', async () => {
	const { t, host, accommodationId } = await setup();
	const owner = t.withIdentity({ subject: host._id });
	await owner.mutation(blockDates, {
		accommodationId,
		startDate: '2026-10-01',
		lastDate: '2026-10-30'
	});
	expect(await t.run((ctx) => ctx.db.query('accommodationBlockedDates').collect())).toHaveLength(
		30
	);
	await t.run((ctx) =>
		ctx.db.patch('accommodations', accommodationId, { timeZone: 'Pacific/Kiritimati' })
	);
	// At noon UTC on October 1 it is already October 2 in this property.
	await expect(
		owner.mutation(unblockDates, {
			accommodationId,
			startDate: '2026-10-01',
			lastDate: '2026-10-01'
		})
	).rejects.toMatchObject({ data: { code: 'INVALID_BLOCKED_DATE_RANGE' } });
	await owner.mutation(unblockDates, {
		accommodationId,
		startDate: '2026-10-02',
		lastDate: '2026-10-02'
	});
	expect(await t.run((ctx) => ctx.db.query('accommodationBlockedDates').collect())).toHaveLength(
		29
	);
});

test('concurrent host blocking and instant booking cannot both take the same night', async () => {
	const { t, host, accommodationId, args, drain } = await setup();
	const owner = t.withIdentity({ subject: host._id });
	await t.run((ctx) => ctx.db.patch('accommodations', accommodationId, { bookingMode: 'instant' }));
	const attempts = await Promise.allSettled([
		owner.mutation(blockDates, {
			accommodationId,
			startDate: '2026-11-02',
			lastDate: '2026-11-02'
		}),
		t.mutation(create, withExpectedTotal({ ...args, expectedBookingMode: 'instant' }))
	]);
	expect(attempts.filter((attempt) => attempt.status === 'fulfilled')).toHaveLength(1);
	await drain();
});

test('email-reference cleanup is bounded, repeatable, and preserves booking and cancellation history', async () => {
	const { t, args, drain } = await setup();
	const id = await t.mutation(create, withExpectedTotal(args));
	await drain();
	const original = await t.run((ctx) => ctx.db.get('bookings', id));
	if (!original) throw new Error('Test booking not found');
	const { sendBookingRequestEmail } =
		await import('../../src/convex/tables/bookings/emails/sendBookingRequestEmail');
	const existingEmailId = await t.run((ctx) =>
		sendBookingRequestEmail(ctx, {
			bookingId: id,
			booking: original,
			accommodationName: accommodation.name,
			email: original.email,
			recipient: 'guest'
		})
	);
	const { _id, _creationTime, ...data } = original;
	const legacySchema = defineSchema({
		...tables,
		bookings: defineTable(
			bookings.validator.extend({
				requestEmailIds: v.optional(v.object({ guest: v.string(), host: v.string() })),
				confirmationEmailId: v.optional(v.string()),
				hostConfirmationEmailId: v.optional(v.string()),
				expirationEmailId: v.optional(v.string())
			})
		)
	});
	const legacy = convexTest(legacySchema, modules);
	const cancellation = {
		actor: 'guest' as const,
		cancelledBy: 'guest-user',
		cancelledAt: Date.now(),
		reason: 'Changed plans',
		kind: 'withdrawal' as const,
		refundPercentage: null,
		emailIds: { guest: existingEmailId }
	};
	const ids = await legacy.run(async (ctx) => [
		await ctx.db.insert('bookings', {
			...data,
			status: 'cancelled',
			cancellation,
			requestEmailIds: { guest: 'request-guest', host: 'request-host' },
			confirmationEmailId: 'confirmation-guest',
			hostConfirmationEmailId: 'confirmation-host',
			expirationEmailId: 'expiration-guest'
		}),
		await ctx.db.insert('bookings', { ...data })
	]);
	const before = await legacy.run(async (ctx) =>
		Promise.all(ids.map((bookingId) => ctx.db.get('bookings', bookingId)))
	);
	vi.mocked(fetch).mockClear();
	const migration = internal.migrations.removeBookingEmailIds.removeBookingEmailIds;
	for (let run = 0; run < 2; run++) {
		let result = await legacy.mutation(migration, {
			cursor: null,
			batchSize: 1,
			oneBatchOnly: true,
			dryRun: false
		});
		let processed = result.processed;
		while (!result.isDone) {
			result = await legacy.mutation(migration, {
				cursor: result.continueCursor,
				batchSize: 1,
				oneBatchOnly: true,
				dryRun: false
			});
			expect(result.processed).toBeLessThanOrEqual(1);
			processed += result.processed;
		}
		expect(processed).toBe(2);
	}
	const after = await legacy.run(async (ctx) =>
		Promise.all(ids.map((bookingId) => ctx.db.get('bookings', bookingId)))
	);
	const {
		requestEmailIds: _requestIds,
		confirmationEmailId: _confirmationId,
		hostConfirmationEmailId: _hostId,
		expirationEmailId: _expirationId,
		...expected
	} = before[0] ?? {};
	expect(after[0]).toEqual(expected);
	expect(after[1]).toEqual(before[1]);
	expect(after[0]?.cancellation).toEqual(cancellation);
	expect(fetch).not.toHaveBeenCalled();
	expect(await legacy.run((ctx) => ctx.db.system.query('_scheduled_functions').take(1))).toEqual(
		[]
	);
});

test.each([false, true])(
	'instant bookings confirm immediately and notify both parties (signed in: %s)',
	async (signedIn) => {
		const { t, args, accommodationId, host, drain } = await setup();
		await t.run((ctx) =>
			ctx.db.patch('accommodations', accommodationId, { bookingMode: 'instant' })
		);
		const guest = signedIn
			? t.withIdentity({ subject: 'guest-user', tokenIdentifier: 'issuer|guest-user' })
			: t;
		const id = await guest.mutation(
			create,
			withExpectedTotal({ ...args, expectedBookingMode: 'instant' })
		);
		const booking = await t.run((ctx) => ctx.db.get('bookings', id));
		expect(booking).toMatchObject({
			status: 'confirmed',
			bookingMode: 'instant'
		});
		expect(booking?.ownerId).toBe(signedIn ? 'guest-user' : undefined);
		expect(booking?.requestExpiresAt).toBeUndefined();
		expect(fetch).not.toHaveBeenCalled();
		await drain();
		const messages = emails();
		expect(messages).toHaveLength(2);
		const guestEmail = messages.find((message) => message.to === 'guest@example.com');
		const hostEmail = messages.find((message) => message.to === 'host@example.com');
		expect(messages.filter((message) => message.to === 'guest@example.com')).toHaveLength(1);
		expect(messages.filter((message) => message.to === 'host@example.com')).toHaveLength(1);
		expect(messages.some((message) => message.subject === 'Your booking is confirmed')).toBe(false);
		expect(guestEmail.subject).toBe('Your Instant Booking is confirmed');
		expect(guestEmail.text).toContain('confirmed immediately');
		expect(hostEmail.text).toContain('no approval is required');
		expect(hostEmail.text).toContain('+381 64 1234567');
		expect(hostEmail.text).toContain('Late arrival');
		expect(hostEmail.reply_to).toEqual(['guest@example.com']);
		expect(hostEmail.text).not.toContain('/find-booking');
		const account = t.withIdentity({ subject: host._id, tokenIdentifier: `issuer|${host._id}` });
		await expect(account.mutation(updateStatus, { id, status: 'confirmed' })).rejects.toMatchObject(
			{ data: { code: 'INVALID_BOOKING_STATUS' } }
		);
		vi.setSystemTime(new Date('2026-10-03T12:00:00Z'));
		await t.mutation(expire, {});
		expect((await t.run((ctx) => ctx.db.get('bookings', id)))?.status).toBe('confirmed');
		await drain();
		expect(emails()).toHaveLength(2);
	}
);

test('instant booking sends only the host notice when guest and host share an email address', async () => {
	const { t, args, accommodationId, drain } = await setup();
	await t.run((ctx) => ctx.db.patch('accommodations', accommodationId, { bookingMode: 'instant' }));
	await t.mutation(
		create,
		withExpectedTotal({
			...args,
			email: ' HOST@EXAMPLE.COM ',
			expectedBookingMode: 'instant'
		})
	);
	await drain();
	expect(emails()).toHaveLength(1);
	expect(emails()[0]).toMatchObject({
		to: 'host@example.com',
		subject: 'New confirmed Instant Booking for your accommodation'
	});
	expect(emails()[0].text).toContain('no approval is required');
});

test('mode changes and missing instant consent cannot silently confirm a request', async () => {
	const { t, args, accommodationId } = await setup();
	await t.run((ctx) => ctx.db.patch('accommodations', accommodationId, { bookingMode: 'instant' }));
	for (const expectedBookingMode of ['request', undefined] as const) {
		await expect(
			t.mutation(create, withExpectedTotal({ ...args, expectedBookingMode }))
		).rejects.toMatchObject({
			data: { code: 'BOOKING_MODE_CHANGED' }
		});
	}
	await t.run((ctx) => ctx.db.patch('accommodations', accommodationId, { bookingMode: 'request' }));
	await expect(
		t.mutation(create, withExpectedTotal({ ...args, expectedBookingMode: 'instant' }))
	).rejects.toMatchObject({ data: { code: 'BOOKING_MODE_CHANGED' } });
	expect(await t.run((ctx) => ctx.db.query('bookings').take(1))).toEqual([]);
	expect(fetch).not.toHaveBeenCalled();
});

test('changing the listing mode leaves existing pending requests under host approval', async () => {
	const { t, args, accommodationId, host, drain } = await setup();
	const id = await t.mutation(create, withExpectedTotal(args));
	await t.run((ctx) => ctx.db.patch('accommodations', accommodationId, { bookingMode: 'instant' }));
	expect((await t.run((ctx) => ctx.db.get('bookings', id)))?.status).toBe('pending');
	const account = t.withIdentity({ subject: host._id, tokenIdentifier: `issuer|${host._id}` });
	await account.mutation(updateStatus, { id, status: 'confirmed' });
	await drain();
	expect(
		emails().find((message) => message.subject === 'Your booking is confirmed').text
	).toContain('Your host has accepted');
});

test('confirmed dates block instant booking, allow same-day turnover, and reopen after cancellation', async () => {
	const { t, args, accommodationId, host, drain } = await setup();
	await t.run((ctx) => ctx.db.patch('accommodations', accommodationId, { bookingMode: 'instant' }));
	const instantArgs = { ...args, expectedBookingMode: 'instant' as const };
	const id = await t.mutation(create, withExpectedTotal(instantArgs));
	await expect(t.mutation(create, withExpectedTotal(instantArgs))).rejects.toMatchObject({
		data: { code: 'BOOKING_DATES_UNAVAILABLE' }
	});
	await t.mutation(
		create,
		withExpectedTotal({
			...instantArgs,
			checkInDate: '2026-11-05',
			checkOutDate: '2026-11-08'
		})
	);
	const account = t.withIdentity({ subject: host._id, tokenIdentifier: `issuer|${host._id}` });
	await account.mutation(updateStatus, { id, status: 'cancelled' });
	const replacement = await t.mutation(create, withExpectedTotal(instantArgs));
	expect((await t.run((ctx) => ctx.db.get('bookings', replacement)))?.status).toBe('confirmed');
	await drain();
});

test('overlapping pending requests cannot both be confirmed', async () => {
	const { t, args, host, drain } = await setup();
	const first = await t.mutation(create, withExpectedTotal(args));
	const second = await t.mutation(create, withExpectedTotal(args));
	const account = t.withIdentity({ subject: host._id, tokenIdentifier: `issuer|${host._id}` });
	await account.mutation(updateStatus, { id: first, status: 'confirmed' });
	await expect(
		account.mutation(updateStatus, { id: second, status: 'confirmed' })
	).rejects.toMatchObject({ data: { code: 'BOOKING_DATES_UNAVAILABLE' } });
	expect((await t.run((ctx) => ctx.db.get('bookings', second)))?.status).toBe('pending');
	await drain();
});

test('concurrent instant submissions cannot reserve the same dates twice', async () => {
	const { t, args, accommodationId, drain } = await setup();
	await t.run((ctx) => ctx.db.patch('accommodations', accommodationId, { bookingMode: 'instant' }));
	const attempts = await Promise.allSettled([
		t.mutation(create, withExpectedTotal({ ...args, expectedBookingMode: 'instant' })),
		t.mutation(create, withExpectedTotal({ ...args, expectedBookingMode: 'instant' }))
	]);
	expect(attempts.filter((attempt) => attempt.status === 'fulfilled')).toHaveLength(1);
	const failure = attempts.find((attempt) => attempt.status === 'rejected');
	expect(failure).toMatchObject({ reason: { data: { code: 'BOOKING_DATES_UNAVAILABLE' } } });
	expect(await t.run((ctx) => ctx.db.query('bookings').take(2))).toHaveLength(1);
	await drain();
	expect(emails()).toHaveLength(2);
});

test('availability fails closed if the bounded index read is incomplete', async () => {
	const { t, args, accommodationId, drain } = await setup();
	const request = await t.mutation(create, withExpectedTotal(args));
	await t.run(async (ctx) => {
		const booking = await ctx.db.get('bookings', request);
		if (!booking) throw new Error('Test booking not found');
		const { _id, _creationTime, ...details } = booking;
		for (let index = 0; index <= BOOKINGS_CONFIG.AVAILABILITY_CHECK_LIMIT; index++) {
			await ctx.db.insert('bookings', {
				...details,
				status: 'confirmed',
				checkInDate: '2026-12-01',
				checkOutDate: '2026-12-05',
				cancellationTerms: bookingCancellationTerms('2026-12-01', '2026-12-05')
			});
		}
		await ctx.db.patch('accommodations', accommodationId, { bookingMode: 'instant' });
	});
	await expect(
		t.mutation(create, withExpectedTotal({ ...args, expectedBookingMode: 'instant' }))
	).rejects.toMatchObject({ data: { code: 'BOOKING_AVAILABILITY_UNAVAILABLE' } });
	await expect(t.query(publicCalendar, { id: accommodationId })).rejects.toMatchObject({
		data: { code: 'BOOKING_AVAILABILITY_UNAVAILABLE' }
	});
	await drain();
	expect(emails()).toHaveLength(2);
});

test('instant host notification enqueue failure rolls back the reservation and guest email', async () => {
	const { t, args, accommodationId } = await setup();
	await t.run((ctx) => ctx.db.patch('accommodations', accommodationId, { bookingMode: 'instant' }));
	const emailModule =
		await import('../../src/convex/tables/bookings/emails/sendBookingConfirmationEmail');
	const original = emailModule.sendBookingConfirmationEmail;
	vi.spyOn(emailModule, 'sendBookingConfirmationEmail').mockImplementation(async (ctx, data) => {
		if (data.hostEmail) throw new Error('Host enqueue failed');
		return original(ctx, data);
	});
	await expect(
		t.mutation(create, withExpectedTotal({ ...args, expectedBookingMode: 'instant' }))
	).rejects.toThrow('Host enqueue failed');
	expect(await t.run((ctx) => ctx.db.query('bookings').take(1))).toEqual([]);
	expect(await t.run((ctx) => ctx.db.system.query('_scheduled_functions').take(1))).toEqual([]);
	expect(fetch).not.toHaveBeenCalled();
});

test('creating an anonymous request atomically queues separate guest and host emails', async () => {
	const { t, args, drain } = await setup();
	const bookingId = await t.mutation(create, withExpectedTotal(args));
	const queued = await t.run((ctx) => ctx.db.get('bookings', bookingId));
	expect(queued?.status).toBe('pending');
	for (const field of [
		'requestEmailIds',
		'confirmationEmailId',
		'hostConfirmationEmailId',
		'expirationEmailId'
	])
		expect(queued).not.toHaveProperty(field);
	expect(fetch).not.toHaveBeenCalled();
	await drain();
	const messages = emails();
	expect(messages).toHaveLength(2);
	const guest = messages.find((message) => message.to === 'guest@example.com');
	const host = messages.find((message) => message.to === 'host@example.com');
	expect(guest.subject).toBe('Your booking request was received');
	expect(guest.text).toContain('does not confirm your stay');
	expect(guest.text).toContain(`/book-confirmation/${bookingId}`);
	expect(guest.text).toContain('/find-booking');
	expect(host.subject).toBe('New booking request for your accommodation');
	expect(host.reply_to).toEqual(['guest@example.com']);
	expect(host.text).toContain('/host/bookings');
	expect(host.text).toContain('confirm or decline');
	expect(host.text).toContain('+381 64 1234567');
	for (const message of messages) {
		expect(message.text).toContain('Europe/Belgrade');
		expect(message.text).toContain('GMT+01:00');
		expect(message.text).toContain('2 adults, 1 child');
		expect(message.text).toContain('No payment was collected');
		expect(message.text).toContain('Late arrival');
	}
	const booking = await t.run((ctx) => ctx.db.get('bookings', bookingId));
	expect(booking?.status).toBe('pending');
});

test('signed-in requests notify the booking contact and actual property host', async () => {
	const { t, args, drain } = await setup();
	const guest = t.withIdentity({ subject: 'guest-user', tokenIdentifier: 'issuer|guest-user' });
	const bookingId = await guest.mutation(create, withExpectedTotal(args));
	await drain();
	expect((await t.run((ctx) => ctx.db.get('bookings', bookingId)))?.ownerId).toBe('guest-user');
	expect(
		emails()
			.map((message) => message.to)
			.sort()
	).toEqual(['guest@example.com', 'host@example.com']);
});

test('emails preserve requested property name and frozen times after listing edits', async () => {
	const { t, args, accommodationId, drain } = await setup();
	const bookingId = await t.mutation(create, withExpectedTotal(args));
	await t.run((ctx) =>
		ctx.db.patch('accommodations', accommodationId, {
			name: 'Changed name',
			timeZone: 'America/New_York',
			checkInStart: '20:00'
		})
	);
	await t.run((ctx) =>
		ctx.db.patch('bookings', bookingId, { firstName: 'Later edit', status: 'confirmed' })
	);
	await drain();
	for (const message of emails()) {
		expect(message.text).toContain('Sunny apartment');
		expect(message.text).toContain('Alex Guest');
		expect(message.text).not.toContain('Later edit');
		expect(message.text).not.toContain('Changed name');
		expect(message.text).toContain('Europe/Belgrade');
	}
});

test('guest names, property names and special requests are escaped in HTML', async () => {
	const { t, args, accommodationId, drain } = await setup();
	await t.run((ctx) =>
		ctx.db.patch('accommodations', accommodationId, { name: '<img src=x onerror=bad()>' })
	);
	await t.mutation(
		create,
		withExpectedTotal({
			...args,
			firstName: '<script>guest</script>',
			specialRequests: '<script>request</script>'
		})
	);
	await drain();
	for (const message of emails()) {
		expect(message.html).not.toContain('<script>');
		expect(message.html).not.toContain('<img src=x');
		expect(message.html).toContain('&lt;script&gt;');
		expect(message.html).toContain('&lt;img');
	}
});

test('invalid and forged requests neither persist bookings nor queue email', async () => {
	const { t, args } = await setup();
	await expect(
		t.mutation(create, withExpectedTotal({ ...args, email: 'invalid' }))
	).rejects.toThrow('INVALID_BOOKING');
	const forged = { ...args, hostEmail: 'attacker@example.com' };
	await expect(t.mutation(create, withExpectedTotal(forged))).rejects.toThrow();
	expect(await t.run((ctx) => ctx.db.query('bookings').collect())).toHaveLength(0);
	expect(await t.run((ctx) => ctx.db.system.query('_scheduled_functions').collect())).toHaveLength(
		0
	);
});

test('transient failure retries the same payload and key, while successful delivery is not repeated', async () => {
	const { t, args, drain } = await setup();
	vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 503 }));
	const bookingId = await t.mutation(create, withExpectedTotal(args));
	await drain();
	expect(fetch).toHaveBeenCalledTimes(2);
	const calls = vi.mocked(fetch).mock.calls;
	const failedKey = new Headers(calls[0][1]?.headers).get('Idempotency-Key');
	const sameKeyCalls = calls.filter(
		([, options]) => new Headers(options?.headers).get('Idempotency-Key') === failedKey
	);
	expect(sameKeyCalls).toHaveLength(2);
	expect(sameKeyCalls[0][1]?.body).toBe(sameKeyCalls[1][1]?.body);
	const booking = await t.run((ctx) => ctx.db.get('bookings', bookingId));
	if (!booking) throw new Error('Test booking not found');
	const { sendBookingRequestEmail } =
		await import('../../src/convex/tables/bookings/emails/sendBookingRequestEmail');
	const emailId = await t.run((ctx) =>
		sendBookingRequestEmail(ctx, {
			bookingId,
			booking,
			email: booking.email,
			recipient: 'guest',
			accommodationName: accommodation.name
		})
	);
	await drain();
	expect(fetch).toHaveBeenCalledTimes(2);
	expect(await emailStatuses(t, { guest: emailId })).toEqual({ guest: 'sent' });
});

test('a host enqueue failure rolls back the booking, guest enqueue and owner aggregate', async () => {
	const { t, args } = await setup();
	const emailModule =
		await import('../../src/convex/tables/bookings/emails/sendBookingRequestEmail');
	const original = emailModule.sendBookingRequestEmail;
	vi.spyOn(emailModule, 'sendBookingRequestEmail').mockImplementation(async (ctx, data) => {
		if (data.recipient === 'host') throw new Error('Host enqueue failed');
		return original(ctx, data);
	});
	const guest = t.withIdentity({ subject: 'guest-user', tokenIdentifier: 'issuer|guest-user' });
	await expect(guest.mutation(create, withExpectedTotal(args))).rejects.toThrow(
		'Host enqueue failed'
	);
	expect(await t.run((ctx) => ctx.db.query('bookings').take(1))).toEqual([]);
	expect(await t.run((ctx) => ctx.db.system.query('_scheduled_functions').collect())).toEqual([]);
	const page = await guest.query(api.tables.bookings.queries.fetchMyBookings.fetchMyBookings, {
		paginationOpts: { cursor: null, numItems: 10 }
	});
	expect(page.items).toEqual([]);
	expect(fetch).not.toHaveBeenCalled();
});

test('missing email configuration rolls back booking creation', async () => {
	const { t, args } = await setup();
	vi.stubEnv('EMAIL_FROM', '');
	await expect(t.mutation(create, withExpectedTotal(args))).rejects.toThrow('Missing EMAIL_FROM');
	expect(await t.run((ctx) => ctx.db.query('bookings').take(1))).toEqual([]);
	expect(fetch).not.toHaveBeenCalled();
});

test.each([false, true])(
	'host confirmation notifies the booking contact once (signed in: %s)',
	async (signedIn) => {
		const { t, args, host, accommodationId, drain } = await setup();
		const guest = signedIn
			? t.withIdentity({ subject: 'guest-user', tokenIdentifier: 'issuer|guest-user' })
			: t;
		const bookingId = await guest.mutation(
			create,
			withExpectedTotal({ ...args, firstName: '<script>Alex</script>' })
		);
		await drain();
		vi.mocked(fetch).mockClear();
		await t.run((ctx) =>
			ctx.db.patch('accommodations', accommodationId, {
				name: '<img src=x onerror=bad()>',
				timeZone: 'America/New_York',
				checkInStart: '20:00'
			})
		);
		const account = t.withIdentity({ subject: host._id, tokenIdentifier: `issuer|${host._id}` });
		await account.mutation(updateStatus, { id: bookingId, status: 'confirmed' });
		const booking = await t.run((ctx) => ctx.db.get('bookings', bookingId));
		expect(booking?.status).toBe('confirmed');
		expect(fetch).not.toHaveBeenCalled();
		await expect(
			account.mutation(updateStatus, { id: bookingId, status: 'confirmed' })
		).rejects.toMatchObject({ data: { code: 'INVALID_BOOKING_STATUS' } });
		await t.run((ctx) => ctx.db.patch('accommodations', accommodationId, { name: 'Later edit' }));
		await drain();
		const messages = emails();
		expect(messages).toHaveLength(1);
		expect(messages[0]).toMatchObject({
			to: 'guest@example.com',
			subject: 'Your booking is confirmed'
		});
		expect(messages[0].text).toContain('Your stay is now confirmed');
		expect(messages[0].text).toContain('Europe/Belgrade');
		expect(messages[0].text).toContain('GMT+01:00');
		expect(messages[0].text).toContain('2 adults, 1 child');
		expect(messages[0].text).toContain(`/book-confirmation/${bookingId}`);
		expect(messages[0].text).toContain('/find-booking');
		expect(messages[0].text).toContain('No payment was collected');
		expect(messages[0].text).not.toContain('Later edit');
		expect(messages[0].html).not.toContain('<script>');
		expect(messages[0].html).not.toContain('<img src=x');
		expect(messages[0].html).toContain('&lt;script&gt;');
		expect(messages[0].html).toContain('&lt;img');
	}
);

test('failed confirmation enqueue leaves the request pending and allows a later retry', async () => {
	const { t, args, host, drain } = await setup();
	const bookingId = await t.mutation(create, withExpectedTotal(args));
	await drain();
	vi.mocked(fetch).mockClear();
	const account = t.withIdentity({ subject: host._id, tokenIdentifier: `issuer|${host._id}` });
	vi.stubEnv('EMAIL_FROM', '');
	await expect(
		account.mutation(updateStatus, { id: bookingId, status: 'confirmed' })
	).rejects.toThrow('Missing EMAIL_FROM');
	const booking = await t.run((ctx) => ctx.db.get('bookings', bookingId));
	expect(booking?.status).toBe('pending');
	expect(fetch).not.toHaveBeenCalled();
	vi.stubEnv('EMAIL_FROM', 'test@example.com');
	await account.mutation(updateStatus, { id: bookingId, status: 'confirmed' });
	await drain();
	expect(emails()).toHaveLength(1);
});

test('unauthorized confirmation and declining a request do not queue a confirmation email', async () => {
	const { t, args, host, drain } = await setup();
	const bookingId = await t.mutation(create, withExpectedTotal(args));
	await drain();
	vi.mocked(fetch).mockClear();
	const stranger = t.withIdentity({ subject: 'stranger', tokenIdentifier: 'issuer|stranger' });
	await expect(
		stranger.mutation(updateStatus, { id: bookingId, status: 'confirmed' })
	).rejects.toMatchObject({ data: { code: 'BOOKING_NOT_FOUND' } });
	await expect(
		t.mutation(updateStatus, { id: bookingId, status: 'confirmed' })
	).rejects.toMatchObject({ data: { code: 'UNAUTHENTICATED' } });
	const account = t.withIdentity({ subject: host._id, tokenIdentifier: `issuer|${host._id}` });
	await account.mutation(updateStatus, { id: bookingId, status: 'declined' });
	await expect(
		account.mutation(updateStatus, { id: bookingId, status: 'confirmed' })
	).rejects.toMatchObject({ data: { code: 'INVALID_BOOKING_STATUS' } });
	await drain();
	expect(fetch).not.toHaveBeenCalled();
});

test('confirmation delivery retries asynchronously without undoing the confirmed booking', async () => {
	const { t, args, host, drain } = await setup();
	const bookingId = await t.mutation(create, withExpectedTotal(args));
	await drain();
	vi.mocked(fetch).mockClear();
	vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 503 }));
	const account = t.withIdentity({ subject: host._id, tokenIdentifier: `issuer|${host._id}` });
	await account.mutation(updateStatus, { id: bookingId, status: 'confirmed' });
	await drain();
	expect(fetch).toHaveBeenCalledTimes(2);
	const calls = vi.mocked(fetch).mock.calls;
	expect(calls[0][1]?.body).toBe(calls[1][1]?.body);
	expect(new Headers(calls[0][1]?.headers).get('Idempotency-Key')).toBe(
		new Headers(calls[1][1]?.headers).get('Idempotency-Key')
	);
	const booking = await t.run((ctx) => ctx.db.get('bookings', bookingId));
	expect(booking?.status).toBe('confirmed');
});

test.each([false, true])(
	'expiration closes an unanswered request and notifies only its guest once (signed in: %s)',
	async (signedIn) => {
		const { t, args, host, drain } = await setup();
		const guest = signedIn
			? t.withIdentity({ subject: 'guest-user', tokenIdentifier: 'issuer|guest-user' })
			: t;
		const bookingId = await guest.mutation(create, withExpectedTotal(args));
		await drain();
		vi.mocked(fetch).mockClear();
		const original = await t.run((ctx) => ctx.db.get('bookings', bookingId));
		if (!original?.requestExpiresAt) throw new Error('Missing deadline');
		expect(original.requestExpiresAt).toBe(
			Date.parse('2026-10-01T12:00:00Z') + BOOKINGS_CONFIG.REQUEST_RESPONSE_WINDOW_MS
		);
		vi.setSystemTime(original.requestExpiresAt - 1);
		expect(await t.mutation(expire, {})).toBe(0);
		vi.setSystemTime(original.requestExpiresAt);
		expect(await t.mutation(expire, {})).toBe(1);
		const expired = await t.run((ctx) => ctx.db.get('bookings', bookingId));
		expect(expired).toMatchObject({
			status: 'expired',
			expiredAt: original.requestExpiresAt
		});
		expect(expired?.cancellation).toBeUndefined();
		expect(expired?.cancellationTerms).toEqual(original.cancellationTerms);
		expect(fetch).not.toHaveBeenCalled();
		expect(await t.mutation(expire, {})).toBe(0);
		const account = t.withIdentity({ subject: host._id, tokenIdentifier: `issuer|${host._id}` });
		await expect(
			account.mutation(updateStatus, { id: bookingId, status: 'confirmed' })
		).rejects.toMatchObject({ data: { code: 'INVALID_BOOKING_STATUS' } });
		await drain();
		const messages = emails();
		expect(messages).toHaveLength(1);
		expect(messages[0]).toMatchObject({
			to: 'guest@example.com',
			subject: 'Your booking request expired'
		});
		expect(messages[0].text).toContain('this stay is not booked');
		expect(messages[0].text).toContain('submit a new request');
		expect(messages[0].text).toContain('Europe/Belgrade');
		expect(messages[0].text).toContain(`/book-confirmation/${bookingId}`);
		expect(messages[0].text).toContain('/find-booking');
		if (signedIn) {
			const page = await guest.query(api.tables.bookings.queries.fetchMyBookings.fetchMyBookings, {
				paginationOpts: { cursor: null, numItems: 10 }
			});
			expect(page.items[0].status).toBe('expired');
		}
	}
);

test('the exact deadline blocks host actions and guest withdrawal before the cron runs, including legacy requests', async () => {
	const { t, args, host, drain } = await setup();
	const guest = t.withIdentity({ subject: 'guest-user', tokenIdentifier: 'issuer|guest-user' });
	const bookingId = await guest.mutation(create, withExpectedTotal(args));
	await drain();
	const booking = await t.run((ctx) => ctx.db.get('bookings', bookingId));
	if (!booking) throw new Error('Missing booking');
	await t.run((ctx) => ctx.db.patch('bookings', bookingId, { requestExpiresAt: undefined }));
	vi.setSystemTime(
		Math.ceil(calculateBookingRequestExpiry({ ...booking, requestExpiresAt: undefined }))
	);
	const account = t.withIdentity({ subject: host._id, tokenIdentifier: `issuer|${host._id}` });
	for (const status of ['confirmed', 'declined', 'cancelled'] as const) {
		await expect(account.mutation(updateStatus, { id: bookingId, status })).rejects.toMatchObject({
			data: { code: 'BOOKING_REQUEST_EXPIRED' }
		});
	}
	await expect(
		guest.mutation(api.tables.bookings.mutations.cancelBooking.cancelBooking, {
			bookingId,
			reason: 'Changed plans',
			expectedStatus: 'pending',
			expectedRefundPercentage: null,
			locale: 'en'
		})
	).rejects.toMatchObject({ data: { code: 'BOOKING_REQUEST_EXPIRED' } });
	expect((await t.run((ctx) => ctx.db.get('bookings', bookingId)))?.status).toBe('pending');
	expect(await t.mutation(expire, {})).toBe(1);
	await drain();
});

test('near-term requests expire at frozen check-in and initialize legacy deadlines without changing other statuses', async () => {
	vi.setSystemTime(new Date('2026-10-01T11:00:00Z'));
	const { t, args, accommodationId, drain } = await setup();
	await t.run((ctx) =>
		ctx.db.patch('accommodations', accommodationId, { sameDayReservation: true })
	);
	const bookingId = await t.mutation(
		create,
		withExpectedTotal({
			...args,
			checkInDate: '2026-10-01',
			checkOutDate: '2026-10-04'
		})
	);
	await drain();
	const booking = await t.run((ctx) => ctx.db.get('bookings', bookingId));
	if (!booking) throw new Error('Missing booking');
	expect(booking.requestExpiresAt).toBe(booking.cancellationTerms.checkInAt);
	await t.run(async (ctx) => {
		await ctx.db.patch('bookings', bookingId, { requestExpiresAt: undefined });
		await ctx.db.patch('accommodations', accommodationId, {
			timeZone: 'America/New_York',
			checkInStart: '23:00'
		});
	});
	expect(await t.mutation(expire, {})).toBe(0);
	vi.setSystemTime(booking.cancellationTerms.checkInAt);
	expect(await t.mutation(expire, {})).toBe(1);
	await drain();
	expect((await t.run((ctx) => ctx.db.get('bookings', bookingId)))?.requestExpiresAt).toBe(
		booking.cancellationTerms.checkInAt
	);
});

test('confirmed and terminal bookings are untouched by expiration', async () => {
	const { t, args, host, drain } = await setup();
	const bookingId = await t.mutation(create, withExpectedTotal(args));
	await drain();
	const account = t.withIdentity({ subject: host._id, tokenIdentifier: `issuer|${host._id}` });
	await account.mutation(updateStatus, { id: bookingId, status: 'confirmed' });
	await drain();
	vi.mocked(fetch).mockClear();
	const booking = await t.run((ctx) => ctx.db.get('bookings', bookingId));
	if (!booking?.requestExpiresAt) throw new Error('Missing booking');
	vi.setSystemTime(booking.requestExpiresAt + 1000);
	for (const status of ['confirmed', 'cancelled', 'declined', 'completed'] as const) {
		await t.run((ctx) => ctx.db.patch('bookings', bookingId, { status }));
		expect(await t.mutation(expire, {})).toBe(0);
		expect((await t.run((ctx) => ctx.db.get('bookings', bookingId)))?.status).toBe(status);
	}
	expect(fetch).not.toHaveBeenCalled();
});

test('expiration enqueue failure rolls back the status and can recover on the next cron', async () => {
	const { t, args, accommodationId, drain } = await setup();
	const bookingId = await t.mutation(
		create,
		withExpectedTotal({ ...args, firstName: '<script>Guest</script>' })
	);
	await drain();
	vi.mocked(fetch).mockClear();
	const booking = await t.run((ctx) => ctx.db.get('bookings', bookingId));
	if (!booking?.requestExpiresAt) throw new Error('Missing booking');
	vi.setSystemTime(booking.requestExpiresAt);
	vi.stubEnv('EMAIL_FROM', '');
	await expect(t.mutation(expire, {})).rejects.toThrow('Missing EMAIL_FROM');
	expect((await t.run((ctx) => ctx.db.get('bookings', bookingId)))?.status).toBe('pending');
	vi.stubEnv('EMAIL_FROM', 'test@example.com');
	await t.run((ctx) => ctx.db.delete('accommodations', accommodationId));
	vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 503 }));
	expect(await t.mutation(expire, {})).toBe(1);
	await drain();
	expect(fetch).toHaveBeenCalledTimes(2);
	const messages = emails();
	expect(messages[0].html).not.toContain('<script>');
	expect(messages[0].html).toContain('&lt;script&gt;');
	expect(messages[0].text).toContain('Unavailable accommodation');
	expect(messages[0]).toEqual(messages[1]);
	expect((await t.run((ctx) => ctx.db.get('bookings', bookingId)))?.status).toBe('expired');
});

test('expiration batches and continuations process legacy requests once without scanning all bookings', async () => {
	const { t, args, drain } = await setup();
	const bookingId = await t.mutation(create, withExpectedTotal(args));
	await drain();
	vi.mocked(fetch).mockClear();
	const original = await t.run((ctx) => ctx.db.get('bookings', bookingId));
	if (!original?.requestExpiresAt) throw new Error('Missing booking');
	const { _id, _creationTime, ...data } = original;
	const count = BOOKINGS_CONFIG.REQUEST_EXPIRATION_BATCH_SIZE + 2;
	await t.run(async (ctx) => {
		await ctx.db.patch('bookings', _id, { requestExpiresAt: undefined });
		for (let i = 1; i < count; i++)
			await ctx.db.insert('bookings', {
				...data,
				requestExpiresAt: undefined
			});
	});
	vi.setSystemTime(original.requestExpiresAt + BOOKINGS_CONFIG.REQUEST_RESPONSE_WINDOW_MS);
	expect(await t.mutation(expire, {})).toBe(BOOKINGS_CONFIG.REQUEST_EXPIRATION_BATCH_SIZE);
	await drain();
	const bookings = await t.run((ctx) => ctx.db.query('bookings').take(count + 1));
	expect(bookings).toHaveLength(count);
	expect(bookings.every((booking) => booking.status === 'expired')).toBe(true);
	expect(emails()).toHaveLength(count);
	expect(await t.mutation(expire, {})).toBe(0);
	await drain();
	expect(emails()).toHaveLength(count);
});
