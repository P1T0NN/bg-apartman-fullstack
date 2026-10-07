/// <reference types="vite/client" />
// @vitest-environment node
import { convexTest } from 'convex-test';
import aggregateTest from '@convex-dev/aggregate/test';
import { createFunctionHandle } from 'convex/server';
import { serializeSignedCookie } from 'better-call';
import { betterAuth } from 'better-auth/minimal';
import { afterEach, expect, test, vi } from 'vitest';
import { components, internal } from '../../src/convex/_generated/api';
import schema from '../../src/convex/schema';
import authSchema from '../../src/convex/betterAuth/component/schema';
import { createAuthOptions } from '../../src/convex/betterAuth/config';
import { ACCOMMODATION_CONFIG } from '../../src/shared/features/accommodations/config';
import { bookingCancellationTerms } from '../fixtures/bookingCancellationTerms';
import { bookingFeeBilling } from '../fixtures/accommodationBilling.js';

const modules = import.meta.glob('../../src/convex/**/*.ts');
const checkDeletion = internal.betterAuth.queries.checkAccountDeletion.checkAccountDeletion;
type AccountDeletionRequest = { callbackURL: string } | { userId: string };
const secret = 'account-deletion-test-secret-at-least-32-characters';
const origin = 'http://localhost:3000';

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

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

async function setup() {
	const t = convexTest(schema, modules);
	aggregateTest.register(t, 'userTotalAggregate');
	t.registerComponent(
		'betterAuth',
		authSchema,
		import.meta.glob('../../src/convex/betterAuth/component/**/*.ts')
	);
	const user = await t.mutation(components.betterAuth.adapter.create, {
		input: {
			model: 'user',
			data: {
				name: 'Account owner',
				email: 'owner@example.com',
				emailVerified: true,
				createdAt: Date.now(),
				updatedAt: Date.now()
			}
		}
	});
	const account = { id: user._id, email: user.email };
	const accommodationId = await t.run((ctx) =>
		ctx.db.insert('accommodations', {
			...bookingFeeBilling,
			supportedPaymentMethods: 'cash',
			...accommodation
		})
	);
	async function seedBooking(
		status: 'pending' | 'confirmed' | 'cancelled' | 'declined' | 'completed' | 'expired',
		relation: 'host' | 'owner' | 'email' = 'host'
	) {
		return t.run((ctx) =>
			ctx.db.insert('bookings', {
				platformFeeTerms: null,
				paymentMethod: 'cash',
				accommodationId,
				status,
				hostId: relation === 'host' ? user._id : 'other-host',
				ownerId: relation === 'owner' ? user._id : undefined,
				email: relation === 'email' ? user.email : 'guest@example.com',
				firstName: 'Guest',
				lastName: 'Guest',
				phone: '12345678',
				checkInDate: '2020-10-01',
				checkOutDate: '2020-10-05',
				adults: 1,
				children: 0,
				cancellationTerms: bookingCancellationTerms('2020-10-01', '2020-10-05')
			})
		);
	}
	async function removeAccount() {
		const onDeleteHandle = await t.run(() => createFunctionHandle(internal.auth.onDelete));
		return t.mutation(components.betterAuth.adapter.deleteOne, {
			input: { model: 'user', where: [{ field: '_id', operator: 'eq', value: user._id }] },
			onDeleteHandle
		});
	}
	async function findAccount() {
		return t.query(components.betterAuth.queries.getUser.getUser, { id: user._id });
	}
	async function sessionHeaders(id = user._id) {
		const token = `session-${id}`;
		await t.mutation(components.betterAuth.adapter.create, {
			input: {
				model: 'session',
				data: {
					userId: id,
					token,
					expiresAt: Date.now() + 86400000,
					createdAt: Date.now(),
					updatedAt: Date.now()
				}
			}
		});
		return new Headers({
			cookie: (await serializeSignedCookie('better-auth.session_token', token, secret)).split(
				';'
			)[0],
			origin
		});
	}
	async function authRequest(path: string, headers: Headers, body?: AccountDeletionRequest) {
		return t.run(async (ctx) => {
			const options = createAuthOptions(ctx);
			const auth = betterAuth({
				...options,
				baseURL: origin,
				secret,
				socialProviders: {},
				rateLimit: { enabled: false }
			});
			const response = await auth.handler(
				new Request(`${origin}/api/auth/${path}`, {
					method: body === undefined ? 'GET' : 'POST',
					headers: new Headers([...headers, ['content-type', 'application/json']]),
					body: body === undefined ? undefined : JSON.stringify(body)
				})
			);
			const text = await response.text();
			return { status: response.status, body: text.startsWith('{') ? JSON.parse(text) : text };
		});
	}
	return {
		t,
		user,
		account,
		accommodationId,
		seedBooking,
		removeAccount,
		findAccount,
		sessionHeaders,
		authRequest
	};
}

for (const relation of ['host', 'owner', 'email'] as const) {
	test.each(['pending', 'confirmed'] as const)(
		`blocks ${relation} deletion with %s bookings, including overdue stays`,
		async (status) => {
			const { t, account, seedBooking, removeAccount, findAccount } = await setup();
			await seedBooking(status, relation);
			expect(await t.query(checkDeletion, account)).toBe('ACCOUNT_HAS_ACTIVE_BOOKINGS');
			await expect(removeAccount()).rejects.toThrow('ACCOUNT_HAS_ACTIVE_BOOKINGS');
			expect(await findAccount()).not.toBeNull();
			expect(
				await t.run((ctx) => ctx.db.system.query('_scheduled_functions').collect())
			).toHaveLength(0);
		}
	);
}

test.each(['cancelled', 'declined', 'completed', 'expired'] as const)(
	'allows deletion with %s history and keeps that history',
	async (status) => {
		const { t, account, seedBooking, removeAccount, findAccount } = await setup();
		const bookingId = await seedBooking(status);
		expect(await t.query(checkDeletion, account)).toBeNull();
		await removeAccount();
		expect(await findAccount()).toBeNull();
		expect((await t.run((ctx) => ctx.db.get('bookings', bookingId)))?.status).toBe(status);
		await t.finishAllScheduledFunctions(() => {});
	}
);

test('requires removal of owned listings even without bookings', async () => {
	const { t, user, account, accommodationId, removeAccount, findAccount } = await setup();
	await t.run((ctx) => ctx.db.patch('accommodations', accommodationId, { ownerId: user._id }));
	expect(await t.query(checkDeletion, account)).toBe('ACCOUNT_HAS_ACCOMMODATIONS');
	await expect(removeAccount()).rejects.toThrow('ACCOUNT_HAS_ACCOMMODATIONS');
	expect(await findAccount()).not.toBeNull();
	await t.run((ctx) => ctx.db.delete('accommodations', accommodationId));
	expect(await t.query(checkDeletion, account)).toBeNull();
});

test('self-service deletion rejects before sending verification email and preserves the session', async () => {
	const { t, account, seedBooking, sessionHeaders, authRequest, findAccount } = await setup();
	await seedBooking('pending', 'owner');
	const headers = await sessionHeaders();
	const fetchMock = vi.fn();
	vi.stubGlobal('fetch', fetchMock);
	const response = await authRequest('delete-user', headers, { callbackURL: '/' });
	expect(response.status).toBe(403);
	expect(response.body).toMatchObject({ code: 'ACCOUNT_HAS_ACTIVE_BOOKINGS' });
	expect(fetchMock).not.toHaveBeenCalled();
	expect(await findAccount()).not.toBeNull();
	expect(
		await t.query(components.betterAuth.adapter.findOne, {
			model: 'session',
			where: [{ field: 'userId', value: account.id }]
		})
	).not.toBeNull();
});

test('a verification token issued before a new booking cannot bypass the deletion restriction', async () => {
	const { t, account, seedBooking, sessionHeaders, authRequest, findAccount } = await setup();
	const headers = await sessionHeaders();
	await t.mutation(components.betterAuth.adapter.create, {
		input: {
			model: 'verification',
			data: {
				identifier: 'delete-account-before-booking',
				value: account.id,
				expiresAt: Date.now() + 86400000,
				createdAt: Date.now(),
				updatedAt: Date.now()
			}
		}
	});
	await seedBooking('confirmed', 'owner');
	const response = await authRequest(
		'delete-user/callback?token=before-booking&callbackURL=/',
		headers
	);
	expect(response.status).toBe(403);
	expect(response.body).toMatchObject({ code: 'ACCOUNT_HAS_ACTIVE_BOOKINGS' });
	expect(await findAccount()).not.toBeNull();
});

test('admin removal is blocked before sessions and credentials are revoked', async () => {
	const { t, user, seedBooking, sessionHeaders, authRequest, findAccount } = await setup();
	await seedBooking('confirmed');
	await sessionHeaders();
	const admin = await t.mutation(components.betterAuth.adapter.create, {
		input: {
			model: 'user',
			data: {
				name: 'Administrator',
				email: 'admin@example.com',
				emailVerified: true,
				role: 'admin',
				createdAt: Date.now(),
				updatedAt: Date.now()
			}
		}
	});
	const headers = await sessionHeaders(admin._id);
	const response = await authRequest('admin/remove-user', headers, { userId: user._id });
	expect(response.status).toBe(403);
	expect(response.body).toMatchObject({ code: 'ACCOUNT_HAS_ACTIVE_BOOKINGS' });
	expect(await findAccount()).not.toBeNull();
	expect(
		await t.query(components.betterAuth.adapter.findOne, {
			model: 'session',
			where: [{ field: 'userId', value: user._id }]
		})
	).not.toBeNull();
});

test('verification completes deletion once all bookings are resolved, preserving history', async () => {
	const { t, account, seedBooking, sessionHeaders, authRequest, findAccount } = await setup();
	const bookingId = await seedBooking('completed', 'owner');
	const headers = await sessionHeaders();
	await t.mutation(components.betterAuth.adapter.create, {
		input: {
			model: 'verification',
			data: {
				identifier: 'delete-account-resolved',
				value: account.id,
				expiresAt: Date.now() + 86400000,
				createdAt: Date.now(),
				updatedAt: Date.now()
			}
		}
	});
	const response = await authRequest('delete-user/callback?token=resolved&callbackURL=/', headers);
	expect(response.status).toBe(302);
	expect(await findAccount()).toBeNull();
	expect((await t.run((ctx) => ctx.db.get('bookings', bookingId)))?.status).toBe('completed');
	await t.finishAllScheduledFunctions(() => {});
});

test('self-service deletion reports the listing restriction, without sending an email', async () => {
	const { t, user, accommodationId, sessionHeaders, authRequest } = await setup();
	await t.run((ctx) => ctx.db.patch('accommodations', accommodationId, { ownerId: user._id }));
	const headers = await sessionHeaders();
	const fetchMock = vi.fn();
	vi.stubGlobal('fetch', fetchMock);
	const response = await authRequest('delete-user', headers, { callbackURL: '/' });
	expect(response.status).toBe(403);
	expect(response.body).toMatchObject({ code: 'ACCOUNT_HAS_ACCOMMODATIONS' });
	expect(fetchMock).not.toHaveBeenCalled();
});
