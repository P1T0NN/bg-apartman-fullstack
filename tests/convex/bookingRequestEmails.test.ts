import { registerResend, successfulResendResponse, emailStatuses } from '../fixtures/resend';
/// <reference types="vite/client" />
import { convexTest } from 'convex-test';
import aggregateTest from '@convex-dev/aggregate/test';
import rateLimiterTest from '@convex-dev/rate-limiter/test';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { api, internal, components } from '../../src/convex/_generated/api';
import schema from '../../src/convex/schema';
import authSchema from '../../src/convex/betterAuth/component/schema';
import { ACCOMMODATION_CONFIG } from '../../src/shared/features/accommodations/config';

const modules = import.meta.glob('../../src/convex/**/*.ts');
const create = api.tables.bookings.mutations.createBooking.createBooking;
const deliver =
	internal.tables.bookings.mutations.enqueueBookingRequestEmail.enqueueBookingRequestEmail;

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
	const drain = () => t.finishAllScheduledFunctions(() => vi.runAllTimers());
	return { t, host, accommodationId, args, drain };
}

function emails() {
	return vi
		.mocked(fetch)
		.mock.calls.flatMap(([, options]) =>
			JSON.parse(String(options?.body)).map((message: { to: string[] }) => ({
				...message,
				to: message.to[0]
			}))
		);
}

test('creating an anonymous request atomically queues separate guest and host emails', async () => {
	const { t, args, drain } = await setup();
	const bookingId = await t.mutation(create, args);
	expect((await t.run((ctx) => ctx.db.get('bookings', bookingId)))?.requestEmailIds).toEqual({});
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
	await t.mutation(deliver, {
		bookingId,
		booking: {
			hostId: booking.hostId,
			email: booking.email,
			firstName: booking.firstName,
			lastName: booking.lastName,
			phone: booking.phone,
			specialRequests: booking.specialRequests,
			adults: booking.adults,
			children: booking.children,
			cancellationTerms: booking.cancellationTerms
		},
		recipient: 'guest',
		accommodationName: accommodation.name
	});
	expect(fetch).toHaveBeenCalledTimes(2);
	expect(await emailStatuses(t, booking.requestEmailIds)).toEqual({ guest: 'sent', host: 'sent' });
});

test('a later host batch failure does not resend the successful guest email or undo the booking', async () => {
	const { t, args, drain } = await setup();
	const bookingId = await t.run((ctx) =>
		ctx.db.insert('bookings', {
			...args,
			hostId: 'unused',
			status: 'pending',
			cancellationTerms: {
				policy: ACCOMMODATION_CONFIG.CANCELLATION_DEFAULT_POLICY,
				timeZone: 'Europe/Belgrade',
				checkInStart: '14:00',
				checkInAt: Date.parse('2026-11-01T13:00:00Z'),
				checkOut: '11:00',
				checkOutAt: Date.parse('2026-11-05T10:00:00Z'),
				pricePerNightMinor: 8025,
				currency: 'EUR'
			}
		})
	);
	const booking = await t.run((ctx) => ctx.db.get('bookings', bookingId));
	if (!booking) throw new Error('Missing test booking');
	await t.mutation(deliver, {
		bookingId,
		booking: {
			hostId: booking.hostId,
			email: booking.email,
			firstName: booking.firstName,
			lastName: booking.lastName,
			phone: booking.phone,
			specialRequests: booking.specialRequests,
			adults: booking.adults,
			children: booking.children,
			cancellationTerms: booking.cancellationTerms
		},
		recipient: 'guest',
		accommodationName: accommodation.name
	});
	await drain();
	const { sendEmail } = await import('../../src/convex/emails/sendEmail');
	vi.mocked(fetch).mockResolvedValue(new Response('Unavailable', { status: 503 }));
	vi.spyOn(console, 'error').mockImplementation(() => {});
	const hostId = await t.run((ctx) =>
		sendEmail(ctx, {
			to: 'host@example.com',
			subject: 'Host notice',
			content: 'Request',
			idempotencyKey: `test-host/${bookingId}`
		})
	);
	await drain();
	const { resend } = await import('../../src/convex/emails/sendEmail');
	expect(
		await emailStatuses(
			t,
			(await t.run((ctx) => ctx.db.get('bookings', bookingId)))?.requestEmailIds
		)
	).toEqual({ guest: 'sent' });
	expect((await t.run((ctx) => resend.status(ctx, hostId)))?.status).toBe('failed');
	expect(
		vi
			.mocked(fetch)
			.mock.calls.filter(([, options]) => JSON.parse(String(options?.body))[0].to[0] === args.email)
	).toHaveLength(1);
	expect((await t.run((ctx) => ctx.db.get('bookings', bookingId)))?.status).toBe('pending');
});
