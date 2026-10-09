import { registerResend, successfulResendResponse } from '../fixtures/resend';
/// <reference types="vite/client" />
import { bookingCancellationTerms } from '../fixtures/bookingCancellationTerms.js';

import { ACCOMMODATION_CONFIG } from '../../src/shared/features/accommodations/config';
import { convexTest } from 'convex-test';
import { z } from 'zod';
import rateLimiterTest from '@convex-dev/rate-limiter/test';
import aggregateTest from '@convex-dev/aggregate/test';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { api, internal, components } from '../../src/convex/_generated/api';
import authSchema from '../../src/convex/betterAuth/component/schema';
import { bookingOwnerAggregate } from '../../src/convex/tables/bookings/aggregates/bookingOwnerAggregate';
import schema from '../../src/convex/schema';
import {
	bookingEmailSchema,
	createBookingSchema
} from '../../src/shared/features/bookings/schemas/bookingSchemas';
import { BOOKINGS_CONFIG } from '../../src/shared/features/bookings/config';
import { PAGINATION_CONFIG } from '../../src/shared/features/pagination/config';
import { GLOBAL_BACKSTOP_MULTIPLIER } from '../../src/convex/rateLimits/ratelimit.config';
import { BOOKING_RECOVERY_REQUEST_RATE_LIMIT } from '../../src/convex/rateLimits/bookingRecoveryRateLimits';
import { bookingFeeBilling } from '../fixtures/accommodationBilling.js';

const modules = import.meta.glob('../../src/convex/**/*.ts');

const issueBookingRecoveryToken =
	internal.tables.bookingRecoveryTokens.actions.issueBookingRecoveryToken.issueBookingRecoveryToken;
const fetchBookings = api.tables.bookings.queries.fetchBooking.fetchBooking;
const backfill = internal.migrations.backfillBookingEmails.backfillBookingEmails;
const cleanupTokens =
	internal.tables.bookingRecoveryTokens.crons.cleanupExpiredBookingRecoveryTokensCron
		.cleanupExpiredBookingRecoveryTokensCron;
const requestBookingRecoveryLink =
	api.tables.bookingRecoveryTokens.actions.requestBookingRecoveryLink.requestBookingRecoveryLink;
const deliverBookingRecoveryLink =
	internal.tables.bookingRecoveryTokens.actions.deliverBookingRecoveryLink
		.deliverBookingRecoveryLink;

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

async function setup(email = 'alex+stay@example.com') {
	const t = convexTest(schema, modules);
	registerResend(t);
	rateLimiterTest.register(t);
	const bookingId = await t.run(async (ctx) => {
		const accommodationId = await ctx.db.insert('accommodations', {
			...bookingFeeBilling,
			supportedPaymentMethods: 'cash',
			ownerId: 'host-1',
			name: 'Apartment',
			description: 'Stay',
			type: 'apartment',
			spaceType: 'entire',
			address: { street: 'Main', streetNumber: '1', city: 'Belgrade', country: 'Serbia' },
			latitude: 44.8,
			longitude: 20.4,
			maxGuests: 4,
			bedrooms: 1,
			beds: 1,
			bathrooms: 1,
			pricePerNightMinor: 8000,
			discountBps: 0,
			weekendPricePerNightMinor: null,
			effectivePricePerNightMinor: 8000,
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
			minimumStay: 1,
			smokingAllowed: false,
			petsAllowed: false,
			partiesAllowed: false,
			houseRules: '',
			cancellationPolicy: ACCOMMODATION_CONFIG.CANCELLATION_DEFAULT_POLICY,
			status: 'published',
			updatedAt: Date.now()
		});
		return ctx.db.insert('bookings', {
			loyaltyStatus: 'ineligible',
			platformFeeTerms: null,
			paymentMethod: 'cash',
			cancellationTerms: bookingCancellationTerms('2026-09-01', '2026-09-05'),
			accommodationId,
			ownerId: 'guest-1',
			hostId: 'host-1',
			status: 'completed',
			completedAt: Date.now() - 1000,
			completedBy: 'host-1',
			completionNote: 'Checked out',
			firstName: 'Alex',
			lastName: 'Guest',
			email,
			phone: '+381641234567',
			checkInDate: '2026-09-01',
			checkOutDate: '2026-09-05',
			adults: 2,
			children: 0,
			searchText: `guest ${email}`.toLowerCase()
		});
	});
	return { t, bookingId };
}

async function hash(secret: string) {
	const bytes = new Uint8Array(
		await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret))
	);
	return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function setupClaim(emailVerified = true, accountEmail = 'alex+stay@example.com') {
	const { t, bookingId } = await setup();
	aggregateTest.register(t, 'bookingOwnerAggregate');
	t.registerComponent(
		'betterAuth',
		authSchema,
		import.meta.glob('../../src/convex/betterAuth/component/**/*.ts')
	);
	await t.run((ctx) => ctx.db.patch('bookings', bookingId, { ownerId: undefined }));
	const user = await t.mutation(components.betterAuth.adapter.create, {
		input: {
			model: 'user',
			data: {
				name: 'Alex',
				email: accountEmail,
				emailVerified,
				createdAt: Date.now(),
				updatedAt: Date.now()
			}
		}
	});
	const session = await t.mutation(components.betterAuth.adapter.create, {
		input: {
			model: 'session',
			data: {
				userId: user._id,
				token: 'test-session',
				expiresAt: Date.now() + 3600000,
				createdAt: Date.now(),
				updatedAt: Date.now()
			}
		}
	});
	const account = t.withIdentity({
		subject: user._id,
		sessionId: session._id,
		email: 'alex+stay@example.com',
		emailVerified: true
	});
	const token = await t.action(issueBookingRecoveryToken, { email: 'alex+stay@example.com' });
	if (!token) throw new Error('Expected recovery token');
	return { t, bookingId, user, account, args: { bookingId, token: token.token } };
}

const claimBooking = api.tables.bookings.mutations.claimBooking.claimBooking;
const previewClaim = api.tables.bookings.queries.fetchBookingToClaim.fetchBookingToClaim;

test('claim preview never changes ownership; explicit and repeated claims update ownership and totals once', async () => {
	const { t, bookingId, user, account, args } = await setupClaim();
	expect((await account.query(previewClaim, args)).isClaimable).toBe(true);
	expect((await t.run((ctx) => ctx.db.get('bookings', bookingId)))?.ownerId).toBeUndefined();
	await Promise.all([account.mutation(claimBooking, args), account.mutation(claimBooking, args)]);
	await account.mutation(claimBooking, args);
	const booking = await t.run((ctx) => ctx.db.get('bookings', bookingId));
	expect(booking).toMatchObject({
		ownerId: user._id,
		status: 'completed',
		completedBy: 'host-1',
		completionNote: 'Checked out'
	});
	expect(await t.run((ctx) => bookingOwnerAggregate.count(ctx, { namespace: user._id }))).toBe(1);
	expect((await account.query(previewClaim, args)).isClaimable).toBe(false);
	const recovered = await t.query(fetchBookings, {
		token: args.token,
		paginationOpts: { cursor: null, numItems: 10 }
	});
	expect(recovered?.items[0].isClaimable).toBe(false);
	const mine = await account.query(api.tables.bookings.queries.fetchMyBookings.fetchMyBookings, {
		paginationOpts: { cursor: null, numItems: 10 }
	});
	expect(mine.items.map((item) => item._id)).toContain(bookingId);
});

test('claim uses the current verified account email rather than JWT email claims', async () => {
	for (const [verified, email, code] of [
		[false, 'alex+stay@example.com', 'BOOKING_EMAIL_UNVERIFIED'],
		[true, 'other@example.com', 'BOOKING_EMAIL_MISMATCH']
	] as const) {
		const { t, bookingId, user, account, args } = await setupClaim(verified, email);
		await expect(account.query(previewClaim, args)).rejects.toThrow(code);
		await expect(account.mutation(claimBooking, args)).rejects.toThrow(code);
		expect((await t.run((ctx) => ctx.db.get('bookings', bookingId)))?.ownerId).toBeUndefined();
		expect(await t.run((ctx) => bookingOwnerAggregate.count(ctx, { namespace: user._id }))).toBe(0);
	}
});

test('claim rejects missing authentication, expired or unrelated grants, and conflicting owners', async () => {
	const { t, bookingId, account, args } = await setupClaim();
	await expect(t.mutation(claimBooking, args)).rejects.toThrow('UNAUTHENTICATED');
	await expect(account.mutation(claimBooking, { ...args, token: 'invalid' })).rejects.toThrow(
		'INVALID_BOOKING_RECOVERY_TOKEN'
	);
	await t.run((ctx) => ctx.db.patch('bookings', bookingId, { email: 'other@example.com' }));
	await expect(account.mutation(claimBooking, args)).rejects.toThrow('BOOKING_NOT_FOUND');
	await t.run((ctx) =>
		ctx.db.patch('bookings', bookingId, {
			email: 'alex+stay@example.com',
			ownerId: 'another-owner'
		})
	);
	await expect(account.mutation(claimBooking, args)).rejects.toThrow('BOOKING_ALREADY_CLAIMED');
	await t.run((ctx) => ctx.db.patch('bookings', bookingId, { ownerId: undefined }));
	vi.advanceTimersByTime(BOOKINGS_CONFIG.RECOVERY_TOKEN_LIFETIME_MS);
	await expect(account.mutation(claimBooking, args)).rejects.toThrow(
		'INVALID_BOOKING_RECOVERY_TOKEN'
	);
	expect((await t.run((ctx) => ctx.db.get('bookings', bookingId)))?.ownerId).toBeUndefined();
});

test('claim rechecks account verification after a successful preview', async () => {
	const { t, bookingId, user, account, args } = await setupClaim();
	expect((await account.query(previewClaim, args)).isClaimable).toBe(true);
	await t.mutation(components.betterAuth.adapter.updateOne, {
		input: {
			model: 'user',
			where: [{ field: '_id', value: user._id }],
			update: { emailVerified: false }
		}
	});
	await expect(account.mutation(claimBooking, args)).rejects.toThrow('BOOKING_EMAIL_UNVERIFIED');
	expect((await t.run((ctx) => ctx.db.get('bookings', bookingId)))?.ownerId).toBeUndefined();
});

test('concurrent verified accounts cannot both claim one booking', async () => {
	const { t, bookingId, user, account, args } = await setupClaim();
	const otherUser = await t.mutation(components.betterAuth.adapter.create, {
		input: {
			model: 'user',
			data: {
				name: 'Other account',
				email: user.email.toUpperCase(),
				emailVerified: true,
				createdAt: Date.now(),
				updatedAt: Date.now()
			}
		}
	});
	const otherSession = await t.mutation(components.betterAuth.adapter.create, {
		input: {
			model: 'session',
			data: {
				userId: otherUser._id,
				token: 'other-session',
				expiresAt: Date.now() + 3600000,
				createdAt: Date.now(),
				updatedAt: Date.now()
			}
		}
	});
	const otherAccount = t.withIdentity({ subject: otherUser._id, sessionId: otherSession._id });
	const outcomes = await Promise.allSettled([
		account.mutation(claimBooking, args),
		otherAccount.mutation(claimBooking, args)
	]);
	expect(outcomes.filter((outcome) => outcome.status === 'fulfilled')).toHaveLength(1);
	const rejected = outcomes.find((outcome) => outcome.status === 'rejected');
	expect(String(rejected?.reason)).toContain('BOOKING_ALREADY_CLAIMED');
	const booking = await t.run((ctx) => ctx.db.get('bookings', bookingId));
	for (const ownerId of [user._id, otherUser._id]) {
		expect(await t.run((ctx) => bookingOwnerAggregate.count(ctx, { namespace: ownerId }))).toBe(
			booking?.ownerId === ownerId ? 1 : 0
		);
	}
});

test('aggregate failure rolls back ownership instead of leaving an incomplete claim', async () => {
	const { t, bookingId, user, account, args } = await setupClaim();
	vi.spyOn(bookingOwnerAggregate, 'insert').mockRejectedValueOnce(
		new Error('Aggregate unavailable')
	);
	await expect(account.mutation(claimBooking, args)).rejects.toThrow('Aggregate unavailable');
	expect((await t.run((ctx) => ctx.db.get('bookings', bookingId)))?.ownerId).toBeUndefined();
	expect(await t.run((ctx) => bookingOwnerAggregate.count(ctx, { namespace: user._id }))).toBe(0);
	await account.mutation(claimBooking, args);
	expect(await t.run((ctx) => bookingOwnerAggregate.count(ctx, { namespace: user._id }))).toBe(1);
});

test('booking validation and recovery lookup normalize case/whitespace without rewriting addresses', async () => {
	const email = ' Alex+Stay@Example.COM ';
	expect(bookingEmailSchema.parse(email)).toBe('alex+stay@example.com');
	expect(bookingEmailSchema.parse(' A.Lex@example.com ')).toBe('a.lex@example.com');
	expect(bookingEmailSchema.safeParse('invalid').success).toBe(false);
	const { t, bookingId } = await setup();
	const booking = await t.run((ctx) => ctx.db.get('bookings', bookingId));
	expect(
		createBookingSchema({ today: '2026-08-01', minimumStay: 1, maxGuests: 4 }).parse({
			expectedPricePerNightMinor: 8025,
			expectedTotalMinor: 24075,
			...booking,
			email
		}).email
	).toBe('alex+stay@example.com');
	const token = await t.action(issueBookingRecoveryToken, { email });
	expect(token?.email).toBe('alex+stay@example.com');
	expect(await t.action(issueBookingRecoveryToken, { email: 'alex@example.com' })).toBeNull();
	expect(await t.action(issueBookingRecoveryToken, { email: 'nobody@example.com' })).toBeNull();
	await expect(t.action(issueBookingRecoveryToken, { email: 'invalid' })).rejects.toThrow();
});

async function request(
	t: Awaited<ReturnType<typeof setup>>['t'],
	email: string,
	locale = 'en',
	guestId?: string
) {
	let settled = false;
	const result = t.action(requestBookingRecoveryLink, { email, locale, guestId }).finally(() => {
		settled = true;
	});
	// Dynamic imports and Web Crypto may complete between timer turns.
	while (!settled)
		await vi.advanceTimersByTimeAsync(BOOKINGS_CONFIG.RECOVERY_REQUEST_MIN_DURATION_MS);
	return result;
}

async function finishDelivery(t: Awaited<ReturnType<typeof setup>>['t']) {
	await t.finishAllScheduledFunctions(() => vi.advanceTimersByTimeAsync(100));
}

test('public requests acknowledge identically while only matching email receives a scoped, reusable link', async () => {
	const { t } = await setup();
	const startedAt = Date.now();
	expect(await request(t, ' Alex+Stay@Example.COM ', 'fr')).toBeNull();
	const scheduled = await t.run((ctx) => ctx.db.system.query('_scheduled_functions').take(10));
	expect(scheduled[0].args).toEqual([{ email: 'alex+stay@example.com', locale: 'fr' }]);
	expect(Date.now() - startedAt).toBeGreaterThanOrEqual(
		BOOKINGS_CONFIG.RECOVERY_REQUEST_MIN_DURATION_MS
	);
	expect(await request(t, 'absent@example.com')).toBeNull();
	await finishDelivery(t);
	expect(fetch).toHaveBeenCalledTimes(1);
	const [endpoint, options] = vi.mocked(fetch).mock.calls[0];
	expect(endpoint).toBe('https://api.resend.com/emails/batch');
	const payload = z
		.object({ to: z.array(z.string()), subject: z.string(), html: z.string(), text: z.string() })
		.parse(JSON.parse(z.string().parse(options?.body))[0]);
	expect(payload.to).toEqual(['alex+stay@example.com']);
	expect(payload.subject).toBe('Your secure booking link');
	for (const content of [payload.html, payload.text]) {
		expect(content).toContain('Do not share it');
		expect(content).toContain('15 minutes');
		expect(content).toContain('can be reopened until it expires');
		expect(content).toContain('Open the link to view your bookings automatically');
	}
	const match = payload.text.match(/https?:\/\/\S+\/find-booking\?token=([a-f0-9]{64})/);
	if (!match) throw new Error('Expected a recovery link in the email');
	const stored = await t.run((ctx) => ctx.db.query('bookingRecoveryTokens').unique());
	expect(stored!.tokenHash).toBe(await hash(match[1]));
	expect(stored!.expiresAt - stored!._creationTime).toBe(
		BOOKINGS_CONFIG.RECOVERY_TOKEN_LIFETIME_MS
	);
	expect(stored!.consumedAt).toBeUndefined();
	expect(
		await t.query(fetchBookings, {
			token: match[1],
			paginationOpts: { cursor: null, numItems: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE }
		})
	).not.toBeNull();
});

test('normalized destination cooldown and hourly budget silently suppress extra delivery', async () => {
	const { t } = await setup();
	expect(await request(t, 'alex+stay@example.com')).toBeNull();
	expect(await request(t, ' ALEX+Stay@Example.com ')).toBeNull();
	await finishDelivery(t);
	expect(fetch).toHaveBeenCalledTimes(1);
	for (let i = 1; i < BOOKINGS_CONFIG.RECOVERY_REQUESTS_PER_HOUR; i++) {
		vi.advanceTimersByTime(BOOKINGS_CONFIG.RECOVERY_RESEND_COOLDOWN_MS);
		expect(await request(t, 'alex+stay@example.com')).toBeNull();
		await finishDelivery(t);
		expect(fetch).toHaveBeenCalledTimes(i + 1);
	}
	vi.advanceTimersByTime(BOOKINGS_CONFIG.RECOVERY_RESEND_COOLDOWN_MS);
	expect(await request(t, 'alex+stay@example.com')).toBeNull();
	await finishDelivery(t);
	expect(fetch).toHaveBeenCalledTimes(BOOKINGS_CONFIG.RECOVERY_REQUESTS_PER_HOUR);
});

test('per-guest anonymous limit suppresses one browser without affecting another', async () => {
	const { t } = await setup();
	const burstTime = Date.now();
	for (let i = 0; i < 21; i++) {
		vi.setSystemTime(burstTime);
		await request(t, `absent-${i}@example.com`, 'en', 'exhausted-guest');
	}
	vi.setSystemTime(burstTime);
	expect(await request(t, 'alex+stay@example.com', 'en', 'exhausted-guest')).toBeNull();

	// A different browser still has its own bucket and can request a link.
	expect(await request(t, 'alex+stay@example.com', 'en', 'other-guest')).toBeNull();
	await finishDelivery(t);
	expect(fetch).toHaveBeenCalledTimes(1);
	expect(await t.run((ctx) => ctx.db.query('bookingRecoveryTokens').take(2))).toHaveLength(1);
});

test('rotating guest ids still hit the shared global backstop', async () => {
	const { t } = await setup();
	const burstTime = Date.now();
	const backstopCapacity =
		BOOKING_RECOVERY_REQUEST_RATE_LIMIT.config.capacity * GLOBAL_BACKSTOP_MULTIPLIER;
	for (let i = 0; i < backstopCapacity; i++) {
		vi.setSystemTime(burstTime);
		await request(t, `absent-${i}@example.com`, 'en', `guest-${i}`);
	}
	vi.setSystemTime(burstTime);
	expect(await request(t, 'alex+stay@example.com', 'en', 'fresh-guest')).toBeNull();
	await finishDelivery(t);
	expect(fetch).not.toHaveBeenCalled();
});

test('validation rejects malformed input; provider errors disclose no credentials or recipient details', async () => {
	const { t } = await setup();
	await expect(
		t.action(requestBookingRecoveryLink, { email: 'invalid', locale: 'en' })
	).rejects.toMatchObject({
		data: { code: 'INVALID_BOOKING_RECOVERY_REQUEST' }
	});
	const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
	vi.stubEnv('EMAIL_FROM', '');
	expect(await request(t, 'alex+stay@example.com')).toBeNull();
	await finishDelivery(t);
	expect(errorLog).toHaveBeenCalledWith('Booking recovery email delivery failed');
	expect(
		await t.action(deliverBookingRecoveryLink, { email: 'alex+stay@example.com', locale: 'en' })
	).toBeNull();
	expect(errorLog.mock.calls).toEqual([
		['Booking recovery email delivery failed'],
		['Booking recovery email delivery failed']
	]);
});

test('reusable token reads are scoped, bounded and read-only, including concurrent reads', async () => {
	const { t, bookingId } = await setup();
	const before = (await t.run((ctx) => ctx.db.get('bookings', bookingId)))!;
	await t.run(async (ctx) => {
		const { _id, _creationTime, ...fields } = before;
		await ctx.db.insert('bookings', { ...fields, email: 'other@example.com' });
		await ctx.db.insert('bookings', { ...fields, checkOutDate: '2026-09-06', status: 'cancelled' });
	});
	const token = (await t.action(issueBookingRecoveryToken, { email: before.email }))!;
	const args = { token: token.token, paginationOpts: { cursor: null, numItems: 1 } };
	const results = await Promise.all([t.query(fetchBookings, args), t.query(fetchBookings, args)]);
	expect(results[0]).toEqual(results[1]);
	expect(results[0]!.items).toHaveLength(1);
	expect(results[0]!.items[0].status).toBe('cancelled');
	expect(results[0]!.items[0].email).toBe(before.email);
	expect(results[0]!.hasNextPage).toBe(true);
	const second = (await t.query(fetchBookings, {
		...args,
		paginationOpts: { cursor: results[0]!.nextCursor, numItems: 1 }
	}))!;
	expect(second.items[0]._id).toBe(bookingId);
	expect(second.hasNextPage).toBe(false);
	for (const key of ['ownerId', 'hostId', 'completedBy', 'completionNote', 'searchText']) {
		expect(second.items[0]).not.toHaveProperty(key);
	}
	const stored = (await t.run((ctx) => ctx.db.query('bookingRecoveryTokens').unique()))!;
	expect(stored.tokenHash).toBe(await hash(token.token));
	expect(JSON.stringify(stored)).not.toContain(token.token);
	expect(stored.consumedAt).toBeUndefined();
	expect(await t.run((ctx) => ctx.db.query('bookingRecoverySessions').take(1))).toEqual([]);
	expect(await t.run((ctx) => ctx.db.get('bookings', bookingId))).toEqual(before);
	expect((await t.query(fetchBookings, args))!.items[0].accommodationName).toBe('Apartment');
	expect(
		(await t.query(fetchBookings, {
			...args,
			paginationOpts: { cursor: null, numItems: 1000 }
		}))!.pageSize
	).toBe(20);
	await t.run((ctx) => ctx.db.delete('accommodations', before.accommodationId));
	await expect(t.query(fetchBookings, args)).rejects.toMatchObject({
		data: { code: 'ACCOMMODATION_NOT_FOUND' }
	});
});

test('invalid tokens and exact expiry fail closed when queries execute', async () => {
	const { t, bookingId } = await setup();
	const paginationOpts = { cursor: null, numItems: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE };
	for (const token of ['', 'invalid', 'a'.repeat(64)]) {
		expect(await t.query(fetchBookings, { token, paginationOpts })).toBeNull();
	}
	const token = (await t.action(issueBookingRecoveryToken, { email: 'alex+stay@example.com' }))!;
	vi.setSystemTime(token.expiresAt - 1);
	expect(await t.query(fetchBookings, { token: token.token, paginationOpts })).not.toBeNull();
	vi.setSystemTime(token.expiresAt);
	expect(await t.query(fetchBookings, { token: token.token, paginationOpts })).toBeNull();
	expect(await t.query(fetchBookings, { token: token.token, paginationOpts })).toBeNull();
	const fresh = (await t.action(issueBookingRecoveryToken, { email: 'alex+stay@example.com' }))!;
	await t.run((ctx) => ctx.db.delete('bookings', bookingId));
	expect((await t.query(fetchBookings, { token: fresh.token, paginationOpts }))!.items).toEqual([]);
});
test('omitting token requires identity and scopes results to its owner; invalid tokens never fall back', async () => {
	const { t, bookingId } = await setup();
	const paginationOpts = { cursor: null, numItems: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE };
	await expect(t.query(fetchBookings, { paginationOpts })).rejects.toMatchObject({
		data: { code: 'UNAUTHENTICATED' }
	});
	const owner = t.withIdentity({ subject: 'guest-1' });
	expect(
		(await owner.query(fetchBookings, { paginationOpts }))!.items.map((booking) => booking._id)
	).toEqual([bookingId]);
	const other = t.withIdentity({ subject: 'guest-2' });
	expect((await other.query(fetchBookings, { paginationOpts }))!.items).toEqual([]);
	for (const token of ['', 'invalid', 'a'.repeat(64)]) {
		expect(await owner.query(fetchBookings, { token, paginationOpts })).toBeNull();
	}
});

test('expiry cron deletes bounded batches, drains its backlog and preserves valid tokens and bookings', async () => {
	const { t, bookingId } = await setup();
	const before = await t.run((ctx) => ctx.db.get('bookings', bookingId));
	const issued = (await t.action(issueBookingRecoveryToken, { email: 'alex+stay@example.com' }))!;
	await t.run(async (ctx) => {
		const stored = (await ctx.db.query('bookingRecoveryTokens').unique())!;
		await ctx.db.patch('bookingRecoveryTokens', stored._id, { expiresAt: Date.now() });
		for (let index = 0; index < BOOKINGS_CONFIG.RECOVERY_TOKEN_CLEANUP_BATCH_SIZE; index++) {
			await ctx.db.insert('bookingRecoveryTokens', {
				tokenHash: `expired-${index}`,
				email: stored.email,
				expiresAt: Date.now() - 1
			});
		}
	});
	const valid = (await t.action(issueBookingRecoveryToken, { email: 'alex+stay@example.com' }))!;
	expect(await t.mutation(cleanupTokens, {})).toBe(
		BOOKINGS_CONFIG.RECOVERY_TOKEN_CLEANUP_BATCH_SIZE
	);
	await finishDelivery(t);
	const remaining = await t.run((ctx) => ctx.db.query('bookingRecoveryTokens').take(2));
	expect(remaining).toHaveLength(1);
	expect(remaining[0].tokenHash).toBe(await hash(valid.token));
	const paginationOpts = { cursor: null, numItems: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE };
	expect(await t.query(fetchBookings, { token: issued.token, paginationOpts })).toBeNull();
	expect(await t.query(fetchBookings, { token: valid.token, paginationOpts })).not.toBeNull();
	expect(await t.mutation(cleanupTokens, {})).toBe(0);
	expect(await t.run((ctx) => ctx.db.get('bookings', bookingId))).toEqual(before);
});

test('bounded backfill resumes and can rerun without changing booking ownership or lifecycle', async () => {
	const { t, bookingId } = await setup(' Alex+Stay@Example.COM ');
	const before = (await t.run((ctx) => ctx.db.get('bookings', bookingId)))!;
	await t.run(async (ctx) => {
		const { _id, _creationTime, ...fields } = before;
		await ctx.db.insert('bookings', { ...fields, email: ' Other@Example.COM ' });
	});
	await expect(
		t.mutation(backfill, {
			oneBatchOnly: true,
			cursor: null,
			batchSize: 1,
			dryRun: true
		})
	).rejects.toMatchObject({ data: { kind: 'DRY RUN' } });
	expect(await t.run((ctx) => ctx.db.get('bookings', bookingId))).toEqual(before);
	const first = await t.mutation(backfill, { oneBatchOnly: true, cursor: null, batchSize: 1 });
	expect(first.isDone).toBe(false);
	await t.mutation(backfill, { oneBatchOnly: true, cursor: first.continueCursor, batchSize: 1 });
	const migrated = await t.run((ctx) => ctx.db.get('bookings', bookingId));
	expect(migrated).toEqual({
		...before,
		email: 'alex+stay@example.com',
		searchText: 'guest alex+stay@example.com'
	});
	expect(await t.action(issueBookingRecoveryToken, { email: 'other@example.com' })).not.toBeNull();
	await t.mutation(backfill, { oneBatchOnly: true, cursor: null, batchSize: 10 });
	expect(await t.run((ctx) => ctx.db.get('bookings', bookingId))).toEqual(migrated);
});
