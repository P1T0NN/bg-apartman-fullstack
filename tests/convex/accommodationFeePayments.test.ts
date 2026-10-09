/// <reference types="vite/client" />

// LIBRARIES
import { convexTest } from 'convex-test';
import rateLimiterTest from '@convex-dev/rate-limiter/test';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

// CONVEX
import { api, internal } from '../../src/convex/_generated/api.js';

// CONFIG
import { ACCOMMODATION_PAYMENT_SIMULATION } from '../../src/shared/features/accommodations/config.js';
import { STRIPE_CONFIG } from '../../src/shared/features/stripe/config.js';

// SCHEMAS
import schema from '../../src/convex/schema.js';

// HELPERS
import { getStripe } from '../../src/convex/stripe/helpers/getStripe.js';
import { limitFeeCheckoutCreation } from '../../src/convex/tables/accommodationFeePayments/ratelimiting/accommodationFeePaymentRateLimits.js';

// UTILS
import { calculatePaidPeriodEnd } from '../../src/shared/features/payments/utils/calculatePaidPeriodEnd.js';

// TYPES
import type { FunctionArgs } from 'convex/server';
import type { Doc } from '../../src/convex/_generated/dataModel.js';

const modules = import.meta.glob('../../src/convex/**/*.ts');
const begin = internal.tables.accommodationFeePayments.mutations.beginFeeCheckout.beginFeeCheckout;
const apply = internal.tables.accommodationFeePayments.mutations.applyFeeCheckout.applyFeeCheckout;
const applyRefund =
	internal.tables.accommodationFeePayments.mutations.applyFeeRefund.applyFeeRefund;
const create = api.tables.accommodationFeePayments.actions.createFeeCheckout.createFeeCheckout;
const refund =
	api.tables.accommodationFeePayments.actions.refundAccommodationFee.refundAccommodationFee;
const refresh = api.tables.accommodationFeePayments.actions.refreshFeePayment.refreshFeePayment;
const history = api.tables.accommodationFeePayments.queries.fetchFeePayments.fetchFeePayments;
const confirmation =
	api.tables.accommodationFeePayments.queries.fetchFeePaymentConfirmation
		.fetchFeePaymentConfirmation;
const webhook = internal.stripe.actions.handleStripeWebhook.handleStripeWebhook;

beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(Date.parse('2026-01-31T12:00:00Z'));
	vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_fixture');
	vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_fixture');
	vi.stubEnv('PUBLIC_ORIGIN', 'https://app.example.com');
});
afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllEnvs();
	vi.unstubAllGlobals();
});

async function setup() {
	const t = convexTest(schema, modules);
	rateLimiterTest.register(t);
	const owner = t.withIdentity({ subject: 'host' });
	const admin = t.withIdentity({ subject: 'admin', role: 'admin' });
	const stranger = t.withIdentity({ subject: 'stranger' });
	const id = await t.run((ctx) =>
		ctx.db.insert('accommodations', {
			loyaltyEligible: false,
			ownerId: 'host',
			name: 'Fee test',
			description: 'Test listing',
			type: 'apartment',
			spaceType: 'entire',
			address: {
				street: 'Test',
				streetNumber: '1',
				city: 'Belgrade',
				country: 'Serbia',
				postalCode: '11000'
			},
			latitude: 44.8,
			longitude: 20.4,
			maxGuests: 2,
			bedrooms: 1,
			beds: 1,
			bathrooms: 1,
			pricePerNightMinor: 10000,
			discountBps: 0,
			weekendPricePerNightMinor: null,
			effectivePricePerNightMinor: 10000,
			recommendationSortKey: -3,
			guestRatingAverage: 0,
			guestReviewCount: 0,
			amenities: [],
			imageKeys: [],
			checkInStart: '14:00',
			checkInEnd: '22:00',
			checkOut: '10:00',
			timeZone: 'Europe/Belgrade',
			minimumStay: 1,
			smokingAllowed: false,
			petsAllowed: false,
			partiesAllowed: false,
			houseRules: '',
			supportedPaymentMethods: 'cash',
			bookingMode: 'request',
			sameDayReservation: false,
			cancellationPolicy: { version: 1, mode: 'full_refund' },
			status: 'unpublished',
			billingPlanId: 'flat_fee',
			billingTerms: { model: 'flat_fee', amountMinor: 30000, currency: 'EUR', intervalMonths: 3 },
			billingStatus: 'pending_payment',
			billingPeriodEndsAt: null,
			updatedAt: Date.now()
		})
	);
	return { t, owner, admin, stranger, id };
}

function receipt(payment: Doc<'accommodationFeePayments'>): FunctionArgs<typeof apply> {
	return {
		paymentReference: payment._id,
		clientReference: payment._id,
		sessionId: 'cs_fee',
		amountMinor: payment.terms.amountMinor,
		currency: payment.terms.currency.toLowerCase(),
		paymentIntentId: 'pi_fee',
		mode: 'payment',
		status: 'complete',
		paymentStatus: 'paid',
		failed: false,
		refundedAmountMinor: 0,
		eventId: 'evt_fee',
		eventType: 'checkout.session.completed'
	};
}

test('checkout ownership, stale plans and legacy simulations cannot grant paid access', async () => {
	const { t, owner, stranger, id } = await setup();
	expect(ACCOMMODATION_PAYMENT_SIMULATION).toBe(false);
	await expect(t.mutation(begin, { accommodationId: id })).rejects.toMatchObject({
		data: { code: 'UNAUTHENTICATED' }
	});
	await expect(stranger.mutation(begin, { accommodationId: id })).rejects.toMatchObject({
		data: { code: 'FORBIDDEN' }
	});
	await expect(
		owner.mutation(
			api.tables.accommodations.mutations.payFlatFeeAccommodation.payFlatFeeAccommodation,
			{ id }
		)
	).rejects.toMatchObject({ data: { code: 'ACCOMMODATION_PAYMENT_SIMULATION_DISABLED' } });
	const first = await owner.mutation(begin, { accommodationId: id });
	const again = await owner.mutation(begin, { accommodationId: id });
	expect(again._id).toBe(first._id);
	await t.run((ctx) =>
		ctx.db.patch('accommodations', id, {
			billingPlanId: 'booking_fee',
			billingTerms: { model: 'booking_fee', commissionBps: 1000 }
		})
	);
	await expect(owner.mutation(begin, { accommodationId: id })).rejects.toMatchObject({
		data: { code: 'ACCOMMODATION_BILLING_PLAN_CHANGED' }
	});
});

test('unattached attempts are replaced before Stripe rejects their creation deadline', async () => {
	const { t, owner, id } = await setup();
	const first = await owner.mutation(begin, { accommodationId: id });
	vi.setSystemTime(first.createdAt + 31 * 60 * 1000);
	const replacement = await owner.mutation(begin, { accommodationId: id });
	expect(replacement._id).not.toBe(first._id);
	expect(await t.run((ctx) => ctx.db.get('accommodationFeePayments', first._id))).toMatchObject({
		status: 'expired',
		invalidated: true
	});
	expect(await t.mutation(apply, receipt(first))).toEqual({ paymentId: first._id, refund: true });
});

test('failed attempts stay failed after old unpaid events and allow a fresh checkout', async () => {
	const { t, owner, id } = await setup();
	const first = await owner.mutation(begin, { accommodationId: id });
	await t.mutation(apply, {
		...receipt(first),
		eventId: 'evt_failed',
		paymentStatus: 'unpaid',
		failed: true
	});
	await t.mutation(apply, {
		...receipt(first),
		eventId: 'evt_old_unpaid',
		paymentStatus: 'unpaid'
	});
	expect(await t.run((ctx) => ctx.db.get('accommodationFeePayments', first._id))).toMatchObject({
		status: 'failed'
	});
	const replacement = await owner.mutation(begin, { accommodationId: id });
	expect(replacement._id).not.toBe(first._id);
});

test('only matching paid provider data grants a period, once, preserving host publication intent', async () => {
	const { t, owner, id } = await setup();
	const payment = await owner.mutation(begin, { accommodationId: id });
	const args = receipt(payment);
	for (const invalid of [
		{ amountMinor: 1 },
		{ currency: 'usd' },
		{ clientReference: 'other' },
		{ mode: 'subscription' }
	])
		await expect(t.mutation(apply, { ...args, ...invalid })).rejects.toThrow('does not match');
	await t.mutation(apply, { ...args, eventId: 'evt_processing', paymentStatus: 'unpaid' });
	expect((await t.run((ctx) => ctx.db.get('accommodations', id)))?.billingStatus).toBe(
		'pending_payment'
	);
	await t.mutation(apply, args);
	const paid = await t.run((ctx) => ctx.db.get('accommodations', id));
	expect(paid).toMatchObject({
		status: 'unpublished',
		billingStatus: 'active',
		billingPeriodEndsAt: Date.parse('2026-04-30T12:00:00Z')
	});
	vi.setSystemTime(Date.parse('2026-02-01T00:00:00Z'));
	await t.mutation(apply, args);
	await t.mutation(apply, {
		...args,
		eventId: 'evt_old_expired',
		paymentStatus: 'unpaid',
		status: 'expired'
	});
	expect(await t.run((ctx) => ctx.db.get('accommodations', id))).toEqual(paid);
	await expect(owner.mutation(begin, { accommodationId: id })).rejects.toMatchObject({
		data: { code: 'ACCOMMODATION_BILLING_PLAN_CHANGED' }
	});
});

test('a billing override invalidates even same-price checkout and late money is marked for refund', async () => {
	const { t, owner, admin, id } = await setup();
	const payment = await owner.mutation(begin, { accommodationId: id });
	await admin.mutation(
		api.tables.accommodations.mutations.updateAccommodationFeeForAdmin
			.updateAccommodationFeeForAdmin,
		{
			id,
			billingTerms: { model: 'flat_fee', ...payment.terms },
			billingStatus: 'pending_payment',
			billingPeriodEndsAt: null
		}
	);
	expect(await t.mutation(apply, receipt(payment))).toEqual({
		paymentId: payment._id,
		refund: true
	});
	expect((await t.run((ctx) => ctx.db.get('accommodations', id)))?.billingStatus).toBe(
		'pending_payment'
	);
	expect(await t.run((ctx) => ctx.db.get('accommodationFeePayments', payment._id))).toMatchObject({
		status: 'refund_pending',
		entitlementApplied: false
	});
});

test('deleted listings and already-refunded payments are never activated', async () => {
	for (const fullyRefunded of [false, true]) {
		const { t, owner, id } = await setup();
		const payment = await owner.mutation(begin, { accommodationId: id });
		if (!fullyRefunded)
			await t.run((ctx) => ctx.db.patch('accommodations', id, { status: 'deleted' }));
		const result = await t.mutation(apply, {
			...receipt(payment),
			refundedAmountMinor: fullyRefunded ? 30000 : 0
		});
		expect(result.refund).toBe(!fullyRefunded);
		expect((await t.run((ctx) => ctx.db.get('accommodations', id)))?.billingStatus).toBe(
			'pending_payment'
		);
	}
});

test('successful refunds revoke only their own period; partial/pending refunds and later overrides are preserved', async () => {
	const { t, owner, admin, id } = await setup();
	const payment = await owner.mutation(begin, { accommodationId: id });
	await t.mutation(apply, receipt(payment));
	await t.mutation(applyRefund, {
		paymentIntentId: 'pi_fee',
		amountMinor: 30000,
		currency: 'eur',
		refundedAmountMinor: 10000,
		refundStatus: 'pending'
	});
	expect((await t.run((ctx) => ctx.db.get('accommodations', id)))?.billingStatus).toBe('active');
	await admin.mutation(
		api.tables.accommodations.mutations.grantFreeAccommodationFeeForAdmin
			.grantFreeAccommodationFeeForAdmin,
		{ id, billingPeriodEndsAt: null }
	);
	await t.mutation(applyRefund, {
		paymentIntentId: 'pi_fee',
		amountMinor: 30000,
		currency: 'eur',
		refundedAmountMinor: 30000,
		refundStatus: 'succeeded',
		eventId: 'evt_refund'
	});
	await t.mutation(apply, { ...receipt(payment), eventId: 'evt_checkout_again' });
	expect(await t.run((ctx) => ctx.db.get('accommodations', id))).toMatchObject({
		billingPlanId: 'free',
		billingStatus: 'active',
		status: 'unpublished'
	});
	expect(await t.run((ctx) => ctx.db.get('accommodationFeePayments', payment._id))).toMatchObject({
		status: 'refunded',
		refundedAmountMinor: 30000
	});
});

test('expired unpaid attempts can be replaced, but their later payment cannot overwrite a new period', async () => {
	const { t, owner, id } = await setup();
	const old = await owner.mutation(begin, { accommodationId: id });
	vi.setSystemTime(old.expiresAt + 1);
	const next = await owner.mutation(begin, { accommodationId: id });
	expect(next._id).not.toBe(old._id);
	await t.mutation(apply, { ...receipt(next), sessionId: 'cs_next', paymentIntentId: 'pi_next' });
	const paid = await t.run((ctx) => ctx.db.get('accommodations', id));
	expect((await t.mutation(apply, { ...receipt(old), eventId: 'evt_old_late' })).refund).toBe(true);
	await t.mutation(applyRefund, {
		paymentIntentId: 'pi_fee',
		amountMinor: 30000,
		currency: 'eur',
		refundedAmountMinor: 30000
	});
	expect(await t.run((ctx) => ctx.db.get('accommodations', id))).toEqual(paid);
});

test('host checkout uses frozen terms, safe return URLs and one-time idempotent provider requests', async () => {
	const { t, owner, stranger, id } = await setup();
	const payment = await owner.mutation(begin, { accommodationId: id });
	const session = {
		id: 'cs_fee',
		object: 'checkout.session',
		client_reference_id: payment._id,
		metadata: { purpose: 'accommodation_flat_fee', paymentId: payment._id },
		mode: 'payment',
		status: 'open',
		payment_status: 'unpaid',
		payment_intent: null,
		amount_total: 30000,
		currency: 'eur',
		url: 'https://checkout.stripe.com/c/pay/test'
	};
	const fetch = vi.fn(async (url: string, init: RequestInit) => {
		expect(url).toMatch(/^https:\/\/api.stripe.com\/v1\/checkout\/sessions/);
		if (init.method === 'POST') {
			const body = new URLSearchParams(String(init.body));
			expect(body.get('mode')).toBe('payment');
			expect(body.get('line_items[0][price_data][unit_amount]')).toBe('30000');
			expect(body.get('success_url')).toContain(
				`https://app.example.com/host/accommodation-payment-successful?fee_payment=${payment._id}`
			);
			expect(body.get('cancel_url')).toBe(
				`https://app.example.com/host/my-accommodations/${id}?tab=billing&fee_checkout=cancelled`
			);
			expect(body.has('subscription_data')).toBe(false);
			expect(body.has('payment_method_types')).toBe(false);
			expect(new Headers(init.headers).get('idempotency-key')).toBe(
				`accommodation-fee-checkout:${payment._id}`
			);
		}
		return new Response(JSON.stringify(session));
	});
	vi.stubGlobal('fetch', fetch);
	expect(await owner.action(create, { accommodationId: id })).toEqual({
		url: session.url,
		paymentId: payment._id
	});
	expect(await owner.action(create, { accommodationId: id })).toEqual({
		url: session.url,
		paymentId: payment._id
	});
	expect((await t.run((ctx) => ctx.db.get('accommodations', id)))?.billingStatus).toBe(
		'pending_payment'
	);
	await expect(stranger.action(refresh, { paymentId: payment._id })).rejects.toMatchObject({
		data: { code: 'FORBIDDEN' }
	});
	await expect(
		stranger.query(history, { accommodationId: id, paginationOpts: { numItems: 5, cursor: null } })
	).rejects.toMatchObject({ data: { code: 'FORBIDDEN' } });
	const page = await owner.query(history, {
		accommodationId: id,
		paginationOpts: { numItems: 5, cursor: null }
	});
	expect(page.items).toHaveLength(1);
	expect(page.items[0]).not.toHaveProperty('checkoutSessionId');
	expect(page.items[0]).not.toHaveProperty('paymentIntentId');
});

test('signed provider events fulfill and refund idempotently; forged events never call Stripe', async () => {
	const { t, owner, admin, id } = await setup();
	const payment = await owner.mutation(begin, { accommodationId: id });
	let refunded = 0;
	let refundPending = true;
	let refundRequests = 0;
	const fetch = vi.fn(async (url: string, init: RequestInit) => {
		const isCheckoutSessionRequest = url.includes('/checkout/sessions/');
		if (isCheckoutSessionRequest)
			return new Response(
				JSON.stringify({
					id: 'cs_fee',
					object: 'checkout.session',
					client_reference_id: payment._id,
					metadata: { purpose: 'accommodation_flat_fee', paymentId: payment._id },
					mode: 'payment',
					status: 'complete',
					payment_status: 'paid',
					payment_intent: 'pi_fee',
					amount_total: 30000,
					currency: 'eur'
				})
			);
		const isPaymentIntentRequest = url.includes('/payment_intents/');
		if (isPaymentIntentRequest)
			return new Response(
				JSON.stringify({
					id: 'pi_fee',
					latest_charge: { amount: 30000, currency: 'eur', amount_refunded: refunded }
				})
			);
		expect(url).toMatch(/\/refunds/);
		if (init.method === 'POST') {
			refundRequests++;
			expect(new Headers(init.headers).get('idempotency-key')).toBe(
				`accommodation-fee-refund:${payment._id}:1`
			);
		}
		return new Response(
			JSON.stringify({
				id: 're_fee',
				payment_intent: 'pi_fee',
				status: refundPending ? 'pending' : 'succeeded'
			})
		);
	});
	vi.stubGlobal('fetch', fetch);
	const signed = (type: string, eventId: string, objectId: string) => {
		const payload = JSON.stringify({
			id: eventId,
			object: 'event',
			type,
			livemode: false,
			data: { object: { id: objectId } }
		});
		return {
			payload,
			signature: getStripe().webhooks.generateTestHeaderString({ payload, secret: 'whsec_fixture' })
		};
	};
	const success = signed('checkout.session.completed', 'evt_signed', 'cs_fee');
	expect(await t.action(webhook, { ...success, signature: 'invalid' })).toBe(false);
	expect(fetch).not.toHaveBeenCalled();
	expect(await t.action(webhook, success)).toBe(true);
	const end = (await t.run((ctx) => ctx.db.get('accommodations', id)))?.billingPeriodEndsAt;
	expect(await t.action(webhook, success)).toBe(true);
	expect((await t.run((ctx) => ctx.db.get('accommodations', id)))?.billingPeriodEndsAt).toBe(end);
	await expect(
		owner.action(refund, { paymentId: payment._id, expectedAmountMinor: 30000 })
	).rejects.toMatchObject({ data: { code: 'FORBIDDEN' } });
	await expect(
		admin.action(refund, { paymentId: payment._id, expectedAmountMinor: 1 })
	).rejects.toMatchObject({ data: { code: 'FEE_REFUND_UNAVAILABLE' } });
	await admin.action(refund, { paymentId: payment._id, expectedAmountMinor: 30000 });
	expect(refundRequests).toBe(1);
	expect((await t.run((ctx) => ctx.db.get('accommodations', id)))?.billingStatus).toBe('active');
	refunded = 30000;
	refundPending = false;
	const refundEvent = signed('refund.updated', 'evt_refunded', 're_fee');
	expect(await t.action(webhook, refundEvent)).toBe(true);
	expect(await t.action(webhook, refundEvent)).toBe(true);
	expect(await t.action(webhook, success)).toBe(true);
	expect(await t.run((ctx) => ctx.db.get('accommodations', id))).toMatchObject({
		billingStatus: 'pending_payment',
		billingPeriodEndsAt: null,
		status: 'unpublished'
	});
	await expect(
		admin.action(refund, { paymentId: payment._id, expectedAmountMinor: 30000 })
	).rejects.toMatchObject({ data: { code: 'FEE_REFUND_UNAVAILABLE' } });
});

test('rapid checkout clicks reuse one provider session and are throttled before more provider calls', async () => {
	const { t, owner, id } = await setup();
	const payment = await owner.mutation(begin, { accommodationId: id });
	const session = {
		id: 'cs_fee',
		object: 'checkout.session',
		client_reference_id: payment._id,
		metadata: { purpose: STRIPE_CONFIG.feePaymentPurpose, paymentId: payment._id },
		mode: 'payment',
		status: 'open',
		payment_status: 'unpaid',
		payment_intent: null,
		amount_total: 30000,
		currency: 'eur',
		url: 'https://checkout.stripe.com/test'
	};
	const fetch = vi.fn(async () => new Response(JSON.stringify(session)));
	vi.stubGlobal('fetch', fetch);
	for (let click = 0; click < STRIPE_CONFIG.checkoutRequestLimit.capacity; click++)
		await owner.action(create, { accommodationId: id });
	const callsBeforeBlockedRequest = fetch.mock.calls.length;
	await expect(owner.action(create, { accommodationId: id })).rejects.toThrow();
	expect(fetch).toHaveBeenCalledTimes(callsBeforeBlockedRequest);
	expect(await t.run((ctx) => ctx.db.query('accommodationFeePayments').collect())).toHaveLength(1);
});

test('payment confirmation is private and only confirms the currently applied paid period', async () => {
	const { t, owner, stranger, id } = await setup();
	const payment = await owner.mutation(begin, { accommodationId: id });
	expect(await stranger.query(confirmation, { paymentId: payment._id })).toBeNull();
	await expect(t.query(confirmation, { paymentId: payment._id })).rejects.toThrow();
	expect(await owner.query(confirmation, { paymentId: payment._id })).toMatchObject({
		status: 'creating',
		isCurrentPaidPeriod: false
	});
	await t.mutation(apply, receipt(payment));
	const result = await owner.query(confirmation, { paymentId: payment._id });
	expect(result).toMatchObject({
		accommodationName: 'Fee test',
		status: 'paid',
		isCurrentPaidPeriod: true,
		terms: { amountMinor: 30000, currency: 'EUR', intervalMonths: 3 },
		paidAt: Date.now()
	});
	expect(result).not.toHaveProperty('checkoutSessionId');
	expect(result).not.toHaveProperty('paymentIntentId');
	await t.run((ctx) =>
		ctx.db.patch('accommodationFeePayments', payment._id, { invalidated: true })
	);
	expect(await owner.query(confirmation, { paymentId: payment._id })).toMatchObject({
		status: 'paid',
		isCurrentPaidPeriod: false
	});
	await t.mutation(applyRefund, {
		paymentIntentId: 'pi_fee',
		amountMinor: 30000,
		currency: 'eur',
		refundedAmountMinor: 30000
	});
	expect(await owner.query(confirmation, { paymentId: payment._id })).toMatchObject({
		status: 'refunded',
		isCurrentPaidPeriod: false
	});
});

test('exhausting one account checkout creation budget does not block another account', async () => {
	const { t } = await setup();
	for (let attempt = 0; attempt < STRIPE_CONFIG.checkoutCreationLimit.capacity; attempt++)
		await t.run((ctx) => limitFeeCheckoutCreation(ctx, 'host'));
	await expect(t.run((ctx) => limitFeeCheckoutCreation(ctx, 'host'))).rejects.toThrow();
	await expect(t.run((ctx) => limitFeeCheckoutCreation(ctx, 'another-host'))).resolves.toBeNull();
});

test('new attempts consume a daily owner budget even when earlier attempts failed', async () => {
	const { t, owner, id } = await setup();
	for (let attempt = 0; attempt < STRIPE_CONFIG.checkoutCreationLimit.capacity; attempt++) {
		const payment = await owner.mutation(begin, { accommodationId: id });
		await t.run((ctx) =>
			ctx.db.patch('accommodationFeePayments', payment._id, { status: 'failed' })
		);
	}
	await expect(owner.mutation(begin, { accommodationId: id })).rejects.toThrow();
	expect(await t.run((ctx) => ctx.db.query('accommodationFeePayments').collect())).toHaveLength(
		STRIPE_CONFIG.checkoutCreationLimit.capacity
	);
});

test('expired local deadlines do not create a second checkout when the original payment succeeded or is processing', async () => {
	for (const paid of [false, true]) {
		const { t, owner, id } = await setup();
		const payment = await owner.mutation(begin, { accommodationId: id });
		await t.mutation(
			internal.tables.accommodationFeePayments.mutations.saveFeeCheckout.saveFeeCheckout,
			{ paymentId: payment._id, sessionId: 'cs_fee', url: 'https://checkout.stripe.com/test' }
		);
		vi.setSystemTime(payment.expiresAt + 1);
		const fetch = vi.fn(async (url: string, init: RequestInit) => {
			expect(init.method).toBe('GET');
			const isIntentRequest = url.includes('/payment_intents/');
			return new Response(
				JSON.stringify(
					isIntentRequest
						? {
								id: 'pi_fee',
								latest_charge: { amount: 30000, currency: 'eur', amount_refunded: 0 }
							}
						: {
								id: 'cs_fee',
								object: 'checkout.session',
								client_reference_id: payment._id,
								metadata: { purpose: STRIPE_CONFIG.feePaymentPurpose, paymentId: payment._id },
								mode: 'payment',
								status: 'complete',
								payment_status: paid ? 'paid' : 'unpaid',
								payment_intent: 'pi_fee',
								amount_total: 30000,
								currency: 'eur',
								url: null
							}
				)
			);
		});
		vi.stubGlobal('fetch', fetch);
		expect(await owner.action(create, { accommodationId: id })).toEqual({
			url: null,
			paymentId: payment._id
		});
		expect(await t.run((ctx) => ctx.db.query('accommodationFeePayments').collect())).toHaveLength(
			1
		);
		expect(await t.run((ctx) => ctx.db.get('accommodationFeePayments', payment._id))).toMatchObject(
			{ status: paid ? 'paid' : 'processing' }
		);
	}
});

test('provider failures prevent replacement; periodic maintenance keeps the receipt scheduled for recovery', async () => {
	const { t, owner, id } = await setup();
	const payment = await owner.mutation(begin, { accommodationId: id });
	await t.mutation(
		internal.tables.accommodationFeePayments.mutations.saveFeeCheckout.saveFeeCheckout,
		{ paymentId: payment._id, sessionId: 'cs_fee', url: null }
	);
	vi.setSystemTime(payment.expiresAt + 1);
	vi.stubGlobal(
		'fetch',
		vi.fn(
			async () =>
				new Response(
					JSON.stringify({ error: { type: 'api_error', message: 'Temporary failure' } }),
					{ status: 503, headers: { 'stripe-should-retry': 'false' } }
				)
		)
	);
	await expect(owner.action(create, { accommodationId: id })).rejects.toThrow();
	expect(await t.run((ctx) => ctx.db.query('accommodationFeePayments').collect())).toHaveLength(1);
	await t.mutation(
		internal.tables.accommodationFeePayments.crons.maintainFeePaymentsCron.maintainFeePaymentsCron,
		{}
	);
	expect(await t.run((ctx) => ctx.db.get('accommodationFeePayments', payment._id))).toMatchObject({
		nextReconcileAt: Date.now() + STRIPE_CONFIG.reconciliationRetryMs
	});
});

test('cleanup deletes provider-confirmed unpaid receipts and old event IDs while retaining paid and unresolved receipts', async () => {
	const { t, owner, id } = await setup();
	const expired = await owner.mutation(begin, { accommodationId: id });
	await t.mutation(apply, {
		...receipt(expired),
		paymentStatus: 'unpaid',
		status: 'expired',
		paymentIntentId: null
	});
	const pending = await owner.mutation(begin, { accommodationId: id });
	vi.setSystemTime(Date.now() + STRIPE_CONFIG.unpaidAttemptRetentionMs + 1);
	await t.mutation(
		internal.tables.accommodationFeePayments.crons.maintainFeePaymentsCron.maintainFeePaymentsCron,
		{}
	);
	expect(await t.run((ctx) => ctx.db.get('accommodationFeePayments', expired._id))).toBeNull();
	expect(await t.run((ctx) => ctx.db.get('accommodationFeePayments', pending._id))).not.toBeNull();
	await t.mutation(apply, { ...receipt(pending), sessionId: 'cs_paid', eventId: 'evt_paid' });
	vi.setSystemTime(Date.now() + STRIPE_CONFIG.webhookEventRetentionMs + 1);
	await t.mutation(
		internal.tables.stripeWebhookEvents.crons.cleanupStripeWebhookEventsCron
			.cleanupStripeWebhookEventsCron,
		{}
	);
	expect(await t.run((ctx) => ctx.db.query('stripeWebhookEvents').collect())).toHaveLength(0);
	await t.mutation(apply, { ...receipt(pending), sessionId: 'cs_paid', eventId: 'evt_paid' });
	expect(await t.run((ctx) => ctx.db.get('accommodationFeePayments', pending._id))).toMatchObject({
		status: 'paid'
	});
});

test('a lost Stripe creation response is recovered before an unattached receipt can be cleaned up', async () => {
	const { t, owner, id } = await setup();
	const payment = await owner.mutation(begin, { accommodationId: id });
	vi.setSystemTime(payment.expiresAt + 1);
	vi.stubGlobal(
		'fetch',
		vi.fn(
			async () =>
				new Response(
					JSON.stringify({
						object: 'list',
						has_more: false,
						data: [
							{
								id: 'cs_lost',
								object: 'checkout.session',
								client_reference_id: payment._id,
								metadata: { purpose: STRIPE_CONFIG.feePaymentPurpose, paymentId: payment._id },
								mode: 'payment',
								status: 'expired',
								payment_status: 'unpaid',
								payment_intent: null,
								amount_total: 30000,
								currency: 'eur',
								url: null
							}
						]
					})
				)
		)
	);
	await t.action(internal.stripe.actions.reconcileFeeCheckout.reconcileFeeCheckout, {
		paymentId: payment._id,
		expire: true
	});
	expect(await t.run((ctx) => ctx.db.get('accommodationFeePayments', payment._id))).toMatchObject({
		checkoutSessionId: 'cs_lost',
		status: 'expired',
		closedAt: Date.now(),
		cleanupAt: Date.now() + STRIPE_CONFIG.unpaidAttemptRetentionMs
	});
});

test('calendar-month periods clamp leap days and reject invalid durations', () => {
	expect(calculatePaidPeriodEnd(Date.parse('2024-01-31T12:00:00Z'), 1)).toBe(
		Date.parse('2024-02-29T12:00:00Z')
	);
	expect(calculatePaidPeriodEnd(Date.parse('2026-11-30T12:00:00Z'), 3)).toBe(
		Date.parse('2027-02-28T12:00:00Z')
	);
	for (const months of [0, -1, 1.5, Number.NaN])
		expect(() => calculatePaidPeriodEnd(Date.now(), months)).toThrow();
});
