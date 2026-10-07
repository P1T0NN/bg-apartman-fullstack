import { registerResend, successfulResendResponse, emailStatuses } from '../fixtures/resend';
/// <reference types="vite/client" />
import { convexTest } from 'convex-test';
import rateLimiterTest from '@convex-dev/rate-limiter/test';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { api, internal, components } from '../../src/convex/_generated/api';
import schema from '../../src/convex/schema';
import authSchema from '../../src/convex/betterAuth/component/schema';
import { ACCOMMODATION_CONFIG } from '../../src/shared/features/accommodations/config';
import { bookingCancellationTerms } from '../fixtures/bookingCancellationTerms.js';
import { checkBookingCancellationRefund } from '../../src/shared/features/bookings/utils/checkBookingCancellationRefund.js';
import { canCancelBooking } from '../../src/shared/features/bookings/utils/canCancelBooking.js';
import { bookingFeeBilling } from '../fixtures/accommodationBilling.js';

const modules = import.meta.glob('../../src/convex/**/*.ts');
const cancel = api.tables.bookings.mutations.cancelBooking.cancelBooking;
const deliver =
	internal.tables.bookings.mutations.enqueueBookingCancellationEmail
		.enqueueBookingCancellationEmail;
const now = Date.parse('2026-10-01T12:00:00Z');
const custom = {
	version: 1,
	mode: 'custom',
	fiveToSevenDays: 100,
	threeToFiveDays: 50,
	oneToThreeDays: 50,
	under24Hours: 0
} as const;

beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(now);
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

async function setup(
	status: 'pending' | 'confirmed' | 'cancelled' | 'declined' | 'completed' = 'confirmed',
	checkInAt = now + 4 * 86400000
) {
	const t = convexTest(schema, modules);
	registerResend(t);
	rateLimiterTest.register(t);
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
				createdAt: now,
				updatedAt: now
			}
		}
	});
	const terms = {
		...bookingCancellationTerms('2026-10-05', '2026-10-08'),
		policy: custom,
		checkInAt
	};
	const { bookingId, accommodationId } = await t.run(async (ctx) => {
		const accommodationId = await ctx.db.insert('accommodations', {
			...bookingFeeBilling,
			supportedPaymentMethods: 'cash',
			ownerId: host._id,
			name: 'Sunny apartment',
			description: 'Stay',
			type: 'apartment',
			spaceType: 'entire',
			address: { street: 'Main', streetNumber: '1', city: 'Belgrade', country: 'Serbia' },
			latitude: 44.8,
			longitude: 20.4,
			maxGuests: 4,
			bedrooms: 1,
			beds: 2,
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
			checkInEnd: '22:00',
			timeZone: 'Europe/Belgrade',
			checkOut: '11:00',
			minimumStay: 1,
			smokingAllowed: false,
			petsAllowed: false,
			partiesAllowed: false,
			houseRules: '',
			cancellationPolicy: ACCOMMODATION_CONFIG.CANCELLATION_DEFAULT_POLICY,
			status: 'published',
			updatedAt: now
		});
		const bookingId = await ctx.db.insert('bookings', {
			platformFeeTerms: null,
			paymentMethod: 'cash',
			ownerId: 'guest-1',
			hostId: host._id,
			status,
			accommodationId,
			cancellationTerms: terms,
			firstName: 'Alex',
			lastName: 'Guest',
			email: 'guest@example.com',
			phone: '123456789',
			checkInDate: '2026-10-05',
			checkOutDate: '2026-10-08',
			adults: 2,
			children: 0
		});
		return { bookingId, accommodationId };
	});
	const account = t.withIdentity({ subject: 'guest-1', tokenIdentifier: 'issuer|guest-1' });
	const args = {
		bookingId,
		reason: '  Travel plans changed.  ',
		expectedStatus: status === 'pending' ? ('pending' as const) : ('confirmed' as const),
		expectedRefundPercentage:
			status === 'pending' ? null : checkBookingCancellationRefund(terms, now),
		locale: 'en'
	};
	const drain = () => t.finishAllScheduledFunctions(() => vi.runAllTimers());
	return { t, bookingId, accommodationId, account, args, terms, host, drain };
}

test('withdrawal is atomic, has no policy outcome, preserves history and notifies both parties', async () => {
	const { t, account, args, bookingId, terms, drain } = await setup('pending');
	await account.mutation(cancel, args);
	const booking = await t.run((ctx) => ctx.db.get('bookings', bookingId));
	expect(booking?.status).toBe('cancelled');
	expect(booking?.cancellationTerms).toEqual(terms);
	expect(booking?.cancellation).toEqual({
		actor: 'guest',
		cancelledBy: 'guest-1',
		cancelledAt: now,
		reason: 'Travel plans changed.',
		kind: 'withdrawal',
		refundPercentage: null,
		emailIds: {}
	});
	await drain();
	expect(
		await emailStatuses(
			t,
			(await t.run((ctx) => ctx.db.get('bookings', bookingId)))?.cancellation?.emailIds
		)
	).toEqual({ guest: 'sent', host: 'sent' });
	const bodies = vi.mocked(fetch).mock.calls.flatMap(([, options]) =>
		JSON.parse(String(options?.body)).map((message: { to: string[] }) => ({
			...message,
			to: message.to[0]
		}))
	);
	expect(bodies.map((body) => body.to).sort()).toEqual(['guest@example.com', 'host@example.com']);
	for (const body of bodies) {
		const heading =
			body.to === 'host@example.com'
				? 'A guest withdrew their booking request'
				: 'Your booking request was withdrawn';
		expect(body.subject).toBe(heading);
		expect(body.html).toContain(`${heading}</h1>`);
		expect(body.text).toContain('without a cancellation charge');
		expect(body.text).toContain('No payment was collected');
		expect(body.text).not.toContain('Refund under');
	}
});

test('confirmed cancellation uses frozen policy after listing edits, escapes the reason and rejects repeats', async () => {
	const { t, account, args, accommodationId, bookingId, drain } = await setup();
	await t.run((ctx) =>
		ctx.db.patch('accommodations', accommodationId, {
			cancellationPolicy: ACCOMMODATION_CONFIG.CANCELLATION_DEFAULT_POLICY,
			timeZone: 'America/New_York'
		})
	);
	await account.mutation(cancel, { ...args, reason: '<script>bad()</script>' });
	expect(
		(await t.run((ctx) => ctx.db.get('bookings', bookingId)))?.cancellation?.refundPercentage
	).toBe(50);
	await expect(account.mutation(cancel, args)).rejects.toThrow('BOOKING_CANCELLATION_NOT_ELIGIBLE');
	await drain();
	expect(fetch).toHaveBeenCalledTimes(1);
	const body = JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body))[0];
	expect(body.html).toContain('&lt;script&gt;');
	expect(body.html).not.toContain('<script>');
	expect(body.text).toContain('50%');
	expect(body.text).toContain('Europe/Belgrade');
});

test('anonymous callers, other guests, hosts, and unclaimed bookings cannot cancel', async () => {
	const { t, account, args, bookingId, host } = await setup();
	await expect(t.mutation(cancel, args)).rejects.toThrow('UNAUTHENTICATED');
	for (const subject of ['other-guest', host._id])
		await expect(t.withIdentity({ subject }).mutation(cancel, args)).rejects.toThrow(
			'BOOKING_NOT_FOUND'
		);
	await t.run((ctx) => ctx.db.patch('bookings', bookingId, { ownerId: undefined }));
	await expect(account.mutation(cancel, args)).rejects.toThrow('BOOKING_NOT_FOUND');
	expect((await t.run((ctx) => ctx.db.get('bookings', bookingId)))?.status).toBe('confirmed');
});

test('reasons are required, trimmed, bounded and checked before any status or notification write', async () => {
	const { t, account, args, bookingId } = await setup();
	for (const reason of ['', '  \n ', 'x'.repeat(501)])
		await expect(account.mutation(cancel, { ...args, reason })).rejects.toThrow(
			'INVALID_BOOKING_CANCELLATION'
		);
	expect((await t.run((ctx) => ctx.db.get('bookings', bookingId)))?.cancellation).toBeUndefined();
	expect(await t.run((ctx) => ctx.db.system.query('_scheduled_functions').collect())).toHaveLength(
		0
	);
});

test('scheduled check-in is exclusive for pending and confirmed bookings; terminal statuses are blocked', async () => {
	for (const status of ['pending', 'confirmed', 'cancelled', 'declined', 'completed'] as const) {
		const { t, account, args, bookingId } = await setup(
			status,
			status === 'pending' || status === 'confirmed' ? now : now + 86400000
		);
		await expect(account.mutation(cancel, args)).rejects.toThrow(
			status === 'pending' ? 'BOOKING_REQUEST_EXPIRED' : 'BOOKING_CANCELLATION_NOT_ELIGIBLE'
		);
		expect((await t.run((ctx) => ctx.db.get('bookings', bookingId)))?.cancellation).toBeUndefined();
	}
	const { account, args, drain } = await setup('confirmed', now + 1);
	await account.mutation(cancel, { ...args, expectedRefundPercentage: 0 });
	await drain();
});

test('a pending request confirmed meanwhile requires a new review; stale refund expectations cannot cancel', async () => {
	const { t, account, args, bookingId } = await setup('pending');
	await t.run((ctx) => ctx.db.patch('bookings', bookingId, { status: 'confirmed' }));
	await expect(account.mutation(cancel, args)).rejects.toThrow('BOOKING_CANCELLATION_CHANGED');
	await expect(
		account.mutation(cancel, {
			...args,
			expectedStatus: 'confirmed',
			expectedRefundPercentage: 100
		})
	).rejects.toThrow('BOOKING_CANCELLATION_CHANGED');
	expect((await t.run((ctx) => ctx.db.get('bookings', bookingId)))?.status).toBe('confirmed');
});

test('a refund deadline crossed during the dialog requires another explicit review', async () => {
	const { account, args, t, bookingId, terms, drain } = await setup(
		'confirmed',
		now + 5 * 86400000
	);
	expect(args.expectedRefundPercentage).toBe(100);
	vi.setSystemTime(now + 1);
	await expect(account.mutation(cancel, args)).rejects.toThrow('BOOKING_CANCELLATION_CHANGED');
	expect((await t.run((ctx) => ctx.db.get('bookings', bookingId)))?.status).toBe('confirmed');
	await account.mutation(cancel, { ...args, expectedRefundPercentage: 50 });
	expect((await t.run((ctx) => ctx.db.get('bookings', bookingId)))?.cancellation?.cancelledAt).toBe(
		now + 1
	);
	expect(canCancelBooking({ status: 'confirmed', cancellationTerms: terms }, terms.checkInAt)).toBe(
		false
	);
	await drain();
});

test('retry uses the same Resend idempotency key and accepted emails are not resent', async () => {
	const { t, account, args, bookingId, drain } = await setup();
	vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 503 }));
	await account.mutation(cancel, args);
	await drain();
	expect(fetch).toHaveBeenCalledTimes(2);
	const keys = vi
		.mocked(fetch)
		.mock.calls.map(([, options]) => new Headers(options?.headers).get('Idempotency-Key'));
	expect(new Set(keys).size).toBe(1);
	expect(
		await emailStatuses(
			t,
			(await t.run((ctx) => ctx.db.get('bookings', bookingId)))?.cancellation?.emailIds
		)
	).toEqual({ guest: 'sent', host: 'sent' });
	await t.mutation(deliver, {
		bookingId,
		recipient: 'guest',
		email: 'guest@example.com',
		accommodationName: 'Sunny apartment',
		locale: 'en'
	});
	expect(fetch).toHaveBeenCalledTimes(2);
});

test('delivery failure exhausts retries without undoing cancellation', async () => {
	const { t, account, args, bookingId, drain } = await setup();
	vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 503 }));
	vi.spyOn(console, 'error').mockImplementation(() => {});
	await account.mutation(cancel, args);
	await drain();
	const booking = await t.run((ctx) => ctx.db.get('bookings', bookingId));
	expect(booking?.status).toBe('cancelled');
	expect(await emailStatuses(t, booking?.cancellation?.emailIds)).toEqual({
		guest: 'failed',
		host: 'failed'
	});
	expect(fetch).toHaveBeenCalledTimes(5);
});

test('hidden or removed properties do not prevent guest cancellation', async () => {
	const { t, account, args, accommodationId, bookingId, drain } = await setup();
	await t.run((ctx) => ctx.db.delete('accommodations', accommodationId));
	await account.mutation(cancel, args);
	expect((await t.run((ctx) => ctx.db.get('bookings', bookingId)))?.status).toBe('cancelled');
	await drain();
});

test('concurrent cancellation attempts produce one history record and one pair of notifications', async () => {
	const { account, args, t, bookingId, drain } = await setup();
	const outcomes = await Promise.allSettled([
		account.mutation(cancel, args),
		account.mutation(cancel, { ...args, reason: 'Second attempt' })
	]);
	expect(outcomes.filter((outcome) => outcome.status === 'fulfilled')).toHaveLength(1);
	expect(outcomes.filter((outcome) => outcome.status === 'rejected')).toHaveLength(1);
	expect((await t.run((ctx) => ctx.db.get('bookings', bookingId)))?.status).toBe('cancelled');
	await drain();
	expect(fetch).toHaveBeenCalledTimes(1);
});

test('all three confirmed outcomes are supported, including no-refund cancellation just before check-in', async () => {
	for (const [hours, percentage] of [
		[200, 100],
		[96, 50],
		[1, 0]
	] as const) {
		const { account, args, t, bookingId, drain } = await setup('confirmed', now + hours * 3600000);
		await account.mutation(cancel, { ...args, expectedRefundPercentage: percentage });
		expect(
			(await t.run((ctx) => ctx.db.get('bookings', bookingId)))?.cancellation?.refundPercentage
		).toBe(percentage);
		await drain();
	}
});

test('legacy missing host accounts do not block guest cancellation and record notification failure', async () => {
	const { t, account, args, bookingId, host, drain } = await setup();
	// Simulate historical orphan data; real account deletion runs the guarded onDelete trigger.
	await t.mutation(components.betterAuth.adapter.deleteOne, {
		input: { model: 'user', where: [{ field: '_id', operator: 'eq', value: host._id }] }
	});
	await account.mutation(cancel, args);
	await drain();
	expect(
		await emailStatuses(
			t,
			(await t.run((ctx) => ctx.db.get('bookings', bookingId)))?.cancellation?.emailIds
		)
	).toEqual({ guest: 'sent' });
	expect(fetch).toHaveBeenCalledTimes(1);
});
