import { registerResend, successfulResendResponse, emailStatuses } from '../fixtures/resend';
/// <reference types="vite/client" />
import { convexTest } from 'convex-test';
import aggregateTest from '@convex-dev/aggregate/test';
import rateLimiterTest from '@convex-dev/rate-limiter/test';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { api, components, internal } from '../../src/convex/_generated/api';
import schema from '../../src/convex/schema';
import authSchema from '../../src/convex/betterAuth/component/schema';
import { ACCOMMODATION_CONFIG } from '../../src/shared/features/accommodations/config';
import { BOOKINGS_CONFIG } from '../../src/shared/features/bookings/config';
import { calculateBookingRequestExpiry } from '../../src/shared/features/bookings/utils/calculateBookingRequestExpiry';

const modules = import.meta.glob('../../src/convex/**/*.ts');
const create = api.tables.bookings.mutations.createBooking.createBooking;
const updateStatus = api.tables.bookings.mutations.updateBookingStatus.updateBookingStatus;
const expire = internal.tables.bookings.crons.expireBookingRequestsCron.expireBookingRequestsCron;

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
		ctx.db.insert('accommodations', { ...accommodation, ownerId: host._id })
	);
	const args = {
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

test('creating an anonymous request atomically queues separate guest and host emails', async () => {
	const { t, args, drain } = await setup();
	const bookingId = await t.mutation(create, args);
	const queued = await t.run((ctx) => ctx.db.get('bookings', bookingId));
	expect(queued?.requestEmailIds).toEqual({ guest: expect.any(String), host: expect.any(String) });
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
	expect(await emailStatuses(t, booking?.requestEmailIds)).toEqual({ guest: 'sent', host: 'sent' });
});

test('signed-in requests notify the booking contact and actual property host', async () => {
	const { t, args, drain } = await setup();
	const guest = t.withIdentity({ subject: 'guest-user', tokenIdentifier: 'issuer|guest-user' });
	const bookingId = await guest.mutation(create, args);
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
	const bookingId = await t.mutation(create, args);
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
	await t.mutation(create, {
		...args,
		firstName: '<script>guest</script>',
		specialRequests: '<script>request</script>'
	});
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
	await expect(t.mutation(create, { ...args, email: 'invalid' })).rejects.toThrow(
		'INVALID_BOOKING'
	);
	const forged = { ...args, hostEmail: 'attacker@example.com' };
	await expect(t.mutation(create, forged)).rejects.toThrow();
	expect(await t.run((ctx) => ctx.db.query('bookings').collect())).toHaveLength(0);
	expect(await t.run((ctx) => ctx.db.system.query('_scheduled_functions').collect())).toHaveLength(
		0
	);
});

test('transient failure retries the same payload and key, while successful delivery is not repeated', async () => {
	const { t, args, drain } = await setup();
	vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 503 }));
	const bookingId = await t.mutation(create, args);
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
	expect(emailId).toBe(booking.requestEmailIds?.guest);
	await drain();
	expect(fetch).toHaveBeenCalledTimes(2);
	expect(await emailStatuses(t, booking.requestEmailIds)).toEqual({ guest: 'sent', host: 'sent' });
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
	await expect(guest.mutation(create, args)).rejects.toThrow('Host enqueue failed');
	expect(await t.run((ctx) => ctx.db.query('bookings').take(1))).toEqual([]);
	expect(await t.run((ctx) => ctx.db.system.query('_scheduled_functions').collect())).toEqual([]);
	const page = await guest.query(api.tables.bookings.queries.fetchMyBookings.fetchMyBookings, {
		paginationOpts: { cursor: null, numItems: 10 }
	});
	expect(page.total).toBe(0);
	expect(page.items).toEqual([]);
	expect(fetch).not.toHaveBeenCalled();
});

test('missing email configuration rolls back booking creation', async () => {
	const { t, args } = await setup();
	vi.stubEnv('EMAIL_FROM', '');
	await expect(t.mutation(create, args)).rejects.toThrow('Missing EMAIL_FROM');
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
		const bookingId = await guest.mutation(create, { ...args, firstName: '<script>Alex</script>' });
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
		expect(booking?.confirmationEmailId).toEqual(expect.any(String));
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
		expect(await emailStatuses(t, { guest: booking?.confirmationEmailId })).toEqual({
			guest: 'sent'
		});
	}
);

test('failed confirmation enqueue leaves the request pending and allows a later retry', async () => {
	const { t, args, host, drain } = await setup();
	const bookingId = await t.mutation(create, args);
	await drain();
	vi.mocked(fetch).mockClear();
	const account = t.withIdentity({ subject: host._id, tokenIdentifier: `issuer|${host._id}` });
	vi.stubEnv('EMAIL_FROM', '');
	await expect(
		account.mutation(updateStatus, { id: bookingId, status: 'confirmed' })
	).rejects.toThrow('Missing EMAIL_FROM');
	const booking = await t.run((ctx) => ctx.db.get('bookings', bookingId));
	expect(booking?.status).toBe('pending');
	expect(booking?.confirmationEmailId).toBeUndefined();
	expect(fetch).not.toHaveBeenCalled();
	vi.stubEnv('EMAIL_FROM', 'test@example.com');
	await account.mutation(updateStatus, { id: bookingId, status: 'confirmed' });
	await drain();
	expect(emails()).toHaveLength(1);
});

test('unauthorized confirmation and declining a request do not queue a confirmation email', async () => {
	const { t, args, host, drain } = await setup();
	const bookingId = await t.mutation(create, args);
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
	expect(
		(await t.run((ctx) => ctx.db.get('bookings', bookingId)))?.confirmationEmailId
	).toBeUndefined();
});

test('confirmation delivery retries asynchronously without undoing the confirmed booking', async () => {
	const { t, args, host, drain } = await setup();
	const bookingId = await t.mutation(create, args);
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
	expect(await emailStatuses(t, { guest: booking?.confirmationEmailId })).toEqual({
		guest: 'sent'
	});
});

test.each([false, true])(
	'expiration closes an unanswered request and notifies only its guest once (signed in: %s)',
	async (signedIn) => {
		const { t, args, host, drain } = await setup();
		const guest = signedIn
			? t.withIdentity({ subject: 'guest-user', tokenIdentifier: 'issuer|guest-user' })
			: t;
		const bookingId = await guest.mutation(create, args);
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
			expiredAt: original.requestExpiresAt,
			expirationEmailId: expect.any(String)
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
		expect(await emailStatuses(t, { guest: expired?.expirationEmailId })).toEqual({
			guest: 'sent'
		});
		if (signedIn) {
			const page = await guest.query(api.tables.bookings.queries.fetchMyBookings.fetchMyBookings, {
				paginationOpts: { cursor: null, numItems: 10 }
			});
			expect(page.total).toBe(1);
			expect(page.items[0].status).toBe('expired');
		}
	}
);

test('the exact deadline blocks host actions and guest withdrawal before the cron runs, including legacy requests', async () => {
	const { t, args, host, drain } = await setup();
	const guest = t.withIdentity({ subject: 'guest-user', tokenIdentifier: 'issuer|guest-user' });
	const bookingId = await guest.mutation(create, args);
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
	const bookingId = await t.mutation(create, {
		...args,
		checkInDate: '2026-10-01',
		checkOutDate: '2026-10-04'
	});
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
	const bookingId = await t.mutation(create, args);
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
	const bookingId = await t.mutation(create, { ...args, firstName: '<script>Guest</script>' });
	await drain();
	vi.mocked(fetch).mockClear();
	const booking = await t.run((ctx) => ctx.db.get('bookings', bookingId));
	if (!booking?.requestExpiresAt) throw new Error('Missing booking');
	vi.setSystemTime(booking.requestExpiresAt);
	vi.stubEnv('EMAIL_FROM', '');
	await expect(t.mutation(expire, {})).rejects.toThrow('Missing EMAIL_FROM');
	expect((await t.run((ctx) => ctx.db.get('bookings', bookingId)))?.status).toBe('pending');
	expect(
		(await t.run((ctx) => ctx.db.get('bookings', bookingId)))?.expirationEmailId
	).toBeUndefined();
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
	const bookingId = await t.mutation(create, args);
	await drain();
	vi.mocked(fetch).mockClear();
	const original = await t.run((ctx) => ctx.db.get('bookings', bookingId));
	if (!original?.requestExpiresAt) throw new Error('Missing booking');
	const { _id, _creationTime, ...data } = original;
	const count = BOOKINGS_CONFIG.REQUEST_EXPIRATION_BATCH_SIZE + 2;
	await t.run(async (ctx) => {
		await ctx.db.patch('bookings', _id, { requestExpiresAt: undefined });
		for (let i = 1; i < count; i++)
			await ctx.db.insert('bookings', { ...data, requestExpiresAt: undefined });
	});
	vi.setSystemTime(original.requestExpiresAt + BOOKINGS_CONFIG.REQUEST_RESPONSE_WINDOW_MS);
	expect(await t.mutation(expire, {})).toBe(BOOKINGS_CONFIG.REQUEST_EXPIRATION_BATCH_SIZE);
	await drain();
	const bookings = await t.run((ctx) => ctx.db.query('bookings').take(count + 1));
	expect(bookings).toHaveLength(count);
	expect(
		bookings.every((booking) => booking.status === 'expired' && booking.expirationEmailId)
	).toBe(true);
	expect(emails()).toHaveLength(count);
	expect(await t.mutation(expire, {})).toBe(0);
	await drain();
	expect(emails()).toHaveLength(count);
});
