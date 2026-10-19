/// <reference types="vite/client" />

// LIBRARIES
import { convexTest } from 'convex-test';
import rateLimiterTest from '@convex-dev/rate-limiter/test';
import aggregateTest from '@convex-dev/aggregate/test';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

// CONVEX
import { api, internal } from '../../src/convex/_generated/api.js';

// CONFIG
import { PAYMENTS_CONFIG } from '../../src/shared/features/payments/config.js';
import { ACCOMMODATION_PAYMENT_SIMULATION } from '../../src/shared/features/accommodations/config.js';

// SCHEMAS
import schema from '../../src/convex/schema.js';

// HELPERS
import { limitFeeCheckoutCreation } from '../../src/convex/tables/accommodationFeePayments/ratelimiting/accommodationFeePaymentRateLimits.js';

// UTILS
import { calculatePaidPeriodEnd } from '../../src/shared/features/payments/utils/calculatePaidPeriodEnd.js';
import { getCheckoutConfig } from '../../src/convex/checkout/helpers/getCheckoutConfig.js';
import { validateCheckoutUrl } from '../../src/shared/features/checkout/utils/validateCheckoutUrl.js';
import * as hostPayouts from '../../src/convex/betterAuth/helpers/getHostPayoutsEnabled.js';
import { bookingCancellationTerms } from '../fixtures/bookingCancellationTerms.js';
import { verifyCheckoutSignature } from '../../src/convex/checkout/utils/verifyCheckoutSignature.js';

// TYPES
import type { FunctionArgs } from 'convex/server';
import type { Doc } from '../../src/convex/_generated/dataModel.js';

const modules = import.meta.glob('../../src/convex/**/*.ts');
const begin = internal.tables.accommodationFeePayments.mutations.beginFeeCheckout.beginFeeCheckout;
const apply = internal.tables.accommodationFeePayments.mutations.applyFeeCheckout.applyFeeCheckout;
const applyRefund =
	internal.tables.accommodationFeePayments.mutations.applyFeeRefund.applyFeeRefund;
const history = api.tables.accommodationFeePayments.queries.fetchFeePayments.fetchFeePayments;
const confirmation =
	api.tables.accommodationFeePayments.queries.fetchFeePaymentConfirmation
		.fetchFeePaymentConfirmation;

test('payment attempts keep their provider environment and invalidated fees cannot be captured', async () => {
	const { owner, t, id } = await setup();
	const payment = await owner.mutation(begin, {
		accommodationId: id,
		provider: 'test-provider',
		providerAccountId: 'test-account',
		providerEnvironment: 'test'
	});
	await expect(
		owner.mutation(begin, {
			accommodationId: id,
			provider: 'test-provider',
			providerAccountId: 'test-account',
			providerEnvironment: 'other'
		})
	).rejects.toThrow();
	const canCapture =
		internal.tables.accommodationFeePayments.queries.fetchFeePaymentCaptureEligibility
			.fetchFeePaymentCaptureEligibility;
	expect(await t.query(canCapture, { paymentId: payment._id })).toBe(true);
	await t.run((ctx) =>
		ctx.db.patch('accommodationFeePayments', payment._id, { invalidated: true })
	);
	expect(await t.query(canCapture, { paymentId: payment._id })).toBe(false);
});

beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(Date.parse('2026-01-31T12:00:00Z'));
});
afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllEnvs();
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

async function setup() {
	const t = convexTest(schema, modules);
	rateLimiterTest.register(t);
	aggregateTest.register(t, 'flatFeeRevenueAggregate');
	aggregateTest.register(t, 'bookingAdminAggregate');
	aggregateTest.register(t, 'bookingFeeDueAggregate');
	aggregateTest.register(t, 'bookingFeePendingAggregate');
	aggregateTest.register(t, 'bookingFeePaidAggregate');
	aggregateTest.register(t, 'bookingFeeRevenueAggregate');
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
		paymentId: payment._id,
		provider: payment.provider,
		providerCheckoutId: 'checkout-fee',
		amountMinor: payment.terms.amountMinor,
		currency: payment.terms.currency.toLowerCase(),
		providerPaymentId: 'payment-fee',
		status: 'paid',
		refundedAmountMinor: 0
	};
}

test('admin refund returns a simulated current period to Pay now and removes its revenue', async () => {
	const { t, owner, admin, id } = await setup();
	vi.stubEnv('CONVEX_CLOUD_URL', 'https://grateful-otter-919.eu-west-1.convex.cloud');
	vi.spyOn(hostPayouts, 'getHostPayoutsEnabled').mockResolvedValue(true);
	await t.run((ctx) => ctx.db.patch('accommodations', id, { status: 'published' }));
	const payment = await owner.mutation(begin, {
		accommodationId: id,
		provider: 'development-simulation',
		providerEnvironment: 'development'
	});
	await t.mutation(apply, receipt(payment));
	const mapQuery =
		api.tables.accommodations.queries.fetchAccommodationsMapSearch.fetchAccommodationsMap;
	const mapArgs = {
		location: { country: 'Serbia' },
		paginationOpts: { cursor: null, numItems: 10 }
	};
	expect((await t.query(mapQuery, mapArgs)).items.map((item) => item._id)).toContain(id);
	const bookingId = await t.run((ctx) =>
		ctx.db.insert('bookings', {
			accommodationId: id,
			hostId: 'host',
			ownerId: 'guest',
			status: 'confirmed',
			paymentMethod: 'cash',
			loyaltyStatus: 'ineligible',
			platformFeeTerms: null,
			cancellationTerms: bookingCancellationTerms('2026-03-01', '2026-03-03'),
			firstName: 'Guest',
			lastName: 'Test',
			email: 'guest@example.com',
			phone: '+381600000000',
			checkInDate: '2026-03-01',
			checkOutDate: '2026-03-03',
			adults: 1,
			children: 0
		})
	);
	const bookingBefore = await t.run((ctx) => ctx.db.get('bookings', bookingId));
	const refundFee =
		api.tables.accommodationFeePayments.mutations.refundAccommodationFee.refundAccommodationFee;
	const args = { paymentId: payment._id, expectedAmountMinor: 30000 };
	await expect(t.mutation(refundFee, args)).rejects.toMatchObject({
		data: { code: 'UNAUTHENTICATED' }
	});
	await expect(owner.mutation(refundFee, args)).rejects.toMatchObject({
		data: { code: 'FORBIDDEN' }
	});
	await expect(
		admin.mutation(refundFee, { ...args, expectedAmountMinor: 1 })
	).rejects.toMatchObject({ data: { code: 'FEE_REFUND_UNAVAILABLE' } });
	await admin.mutation(refundFee, args);
	await expect(admin.mutation(refundFee, args)).rejects.toMatchObject({
		data: { code: 'FEE_REFUND_UNAVAILABLE' }
	});
	expect(await t.run((ctx) => ctx.db.get('accommodations', id))).toMatchObject({
		status: 'published',
		billingPlanId: 'flat_fee',
		billingStatus: 'pending_payment',
		billingPeriodEndsAt: null
	});
	expect(await t.run((ctx) => ctx.db.get('accommodationFeePayments', payment._id))).toMatchObject({
		status: 'refunded',
		refundStatus: 'succeeded',
		refundedAmountMinor: 30000,
		entitlementApplied: false,
		refundRequestedBy: 'admin'
	});
	expect(await t.run((ctx) => ctx.db.get('bookings', bookingId))).toEqual(bookingBefore);
	expect((await t.query(mapQuery, mapArgs)).items).toEqual([]);
	const stats = await admin.query(
		api.tables.accommodationFeePayments.queries.fetchAdminDashboard.fetchAdminDashboard,
		{ from: Date.parse('2026-01-31T00:00:00Z'), to: Date.parse('2026-01-31T23:59:59.999Z') }
	);
	expect(stats.current).toMatchObject({ revenue: 0, flatFeeRevenue: 0 });
	const next = await owner.mutation(begin, {
		accommodationId: id,
		provider: 'development-simulation',
		providerEnvironment: 'development'
	});
	expect(next._id).not.toBe(payment._id);
});

test('admin refund confirms only the remaining amount after a partial refund', async () => {
	const { t, owner, admin, id } = await setup();
	vi.stubEnv('CONVEX_CLOUD_URL', 'https://grateful-otter-919.eu-west-1.convex.cloud');
	const payment = await owner.mutation(begin, {
		accommodationId: id,
		provider: 'development-simulation',
		providerEnvironment: 'development'
	});
	await t.mutation(apply, receipt(payment));
	await t.mutation(applyRefund, {
		provider: payment.provider,
		providerPaymentId: 'payment-fee',
		amountMinor: 30000,
		currency: 'EUR',
		refundedAmountMinor: 10000,
		refundStatus: 'succeeded'
	});
	const refundFee =
		api.tables.accommodationFeePayments.mutations.refundAccommodationFee.refundAccommodationFee;
	await expect(
		admin.mutation(refundFee, { paymentId: payment._id, expectedAmountMinor: 30000 })
	).rejects.toMatchObject({ data: { code: 'FEE_REFUND_UNAVAILABLE' } });
	await admin.mutation(refundFee, { paymentId: payment._id, expectedAmountMinor: 20000 });
	expect(await t.run((ctx) => ctx.db.get('accommodationFeePayments', payment._id))).toMatchObject({
		status: 'refunded',
		refundedAmountMinor: 30000,
		refundAmountMinor: 20000
	});
});

test('admin refund of an older simulated receipt preserves a newer paid period', async () => {
	const { t, owner, admin, id } = await setup();
	vi.stubEnv('CONVEX_CLOUD_URL', 'https://grateful-otter-919.eu-west-1.convex.cloud');
	const old = await owner.mutation(begin, {
		accommodationId: id,
		provider: 'development-simulation',
		providerEnvironment: 'development'
	});
	await t.mutation(apply, receipt(old));
	vi.setSystemTime(Date.parse('2026-05-01T12:00:00Z'));
	const next = await owner.mutation(begin, {
		accommodationId: id,
		provider: 'development-simulation',
		providerEnvironment: 'development'
	});
	await t.mutation(apply, {
		...receipt(next),
		providerCheckoutId: 'new-checkout',
		providerPaymentId: 'new-payment'
	});
	const before = await t.run((ctx) => ctx.db.get('accommodations', id));
	await admin.mutation(
		api.tables.accommodationFeePayments.mutations.refundAccommodationFee.refundAccommodationFee,
		{ paymentId: old._id, expectedAmountMinor: 30000 }
	);
	expect(await t.run((ctx) => ctx.db.get('accommodations', id))).toEqual(before);
});

test('admin refund simulation cannot mark real provider payments or production payments refunded', async () => {
	for (const provider of ['test-provider', 'development-simulation']) {
		const { t, owner, admin, id } = await setup();
		vi.stubEnv(
			'CONVEX_CLOUD_URL',
			provider === 'test-provider'
				? 'https://grateful-otter-919.eu-west-1.convex.cloud'
				: 'https://production.example.com'
		);
		const payment = await owner.mutation(begin, {
			accommodationId: id,
			provider,
			providerEnvironment: 'development'
		});
		await t.mutation(apply, receipt(payment));
		await expect(
			admin.mutation(
				api.tables.accommodationFeePayments.mutations.refundAccommodationFee.refundAccommodationFee,
				{ paymentId: payment._id, expectedAmountMinor: 30000 }
			)
		).rejects.toMatchObject({ data: { code: 'FEE_REFUND_NOT_SUPPORTED' } });
		expect(
			(await t.run((ctx) => ctx.db.get('accommodationFeePayments', payment._id)))?.status
		).toBe('paid');
	}
});

test('checkout ownership, stale plans and legacy simulations cannot grant paid access', async () => {
	const { t, owner, stranger, id } = await setup();
	expect(ACCOMMODATION_PAYMENT_SIMULATION).toBe(false);
	await expect(
		t.mutation(begin, { accommodationId: id, provider: 'test-provider' })
	).rejects.toMatchObject({
		data: { code: 'UNAUTHENTICATED' }
	});
	await expect(
		stranger.mutation(begin, { accommodationId: id, provider: 'test-provider' })
	).rejects.toMatchObject({
		data: { code: 'FORBIDDEN' }
	});
	await expect(
		owner.mutation(
			api.tables.accommodations.mutations.payFlatFeeAccommodation.payFlatFeeAccommodation,
			{ id }
		)
	).rejects.toMatchObject({ data: { code: 'ACCOMMODATION_PAYMENT_SIMULATION_DISABLED' } });
	const first = await owner.mutation(begin, { accommodationId: id, provider: 'test-provider' });
	const again = await owner.mutation(begin, { accommodationId: id, provider: 'test-provider' });
	expect(again._id).toBe(first._id);
	await t.run((ctx) =>
		ctx.db.patch('accommodations', id, {
			billingPlanId: 'booking_fee',
			billingTerms: { model: 'booking_fee', commissionBps: 1000 }
		})
	);
	await expect(
		owner.mutation(begin, { accommodationId: id, provider: 'test-provider' })
	).rejects.toMatchObject({
		data: { code: 'ACCOMMODATION_BILLING_PLAN_CHANGED' }
	});
});

test('expired unattached attempts can be replaced without provider timing assumptions', async () => {
	const { t, owner, id } = await setup();
	const first = await owner.mutation(begin, { accommodationId: id, provider: 'test-provider' });
	vi.setSystemTime(first.expiresAt + 1);
	const replacement = await owner.mutation(begin, {
		accommodationId: id,
		provider: 'test-provider'
	});
	expect(replacement._id).not.toBe(first._id);
	expect(await t.run((ctx) => ctx.db.get('accommodationFeePayments', first._id))).toMatchObject({
		status: 'expired',
		invalidated: true
	});
	expect(await t.mutation(apply, receipt(first))).toEqual({ paymentId: first._id, refund: true });
});

test('failed attempts stay failed after old unpaid events and allow a fresh checkout', async () => {
	const { t, owner, id } = await setup();
	const first = await owner.mutation(begin, { accommodationId: id, provider: 'test-provider' });
	await t.mutation(apply, {
		...receipt(first),

		status: 'failed'
	});
	await t.mutation(apply, {
		...receipt(first),
		status: 'processing'
	});
	expect(await t.run((ctx) => ctx.db.get('accommodationFeePayments', first._id))).toMatchObject({
		status: 'failed'
	});
	const replacement = await owner.mutation(begin, {
		accommodationId: id,
		provider: 'test-provider'
	});
	expect(replacement._id).not.toBe(first._id);
});

test('only matching paid provider data grants a period, once, preserving host publication intent', async () => {
	const { t, owner, id } = await setup();
	const payment = await owner.mutation(begin, { accommodationId: id, provider: 'test-provider' });
	const args = receipt(payment);
	for (const invalid of [
		{ amountMinor: 1 },
		{ currency: 'usd' },
		{ provider: 'other-provider' },
		{ providerCheckoutId: '' }
	])
		await expect(t.mutation(apply, { ...args, ...invalid })).rejects.toThrow('does not match');
	await t.mutation(apply, { ...args, status: 'processing' });
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

		status: 'expired'
	});
	expect(await t.run((ctx) => ctx.db.get('accommodations', id))).toEqual(paid);
	await expect(
		owner.mutation(begin, { accommodationId: id, provider: 'test-provider' })
	).rejects.toMatchObject({
		data: { code: 'ACCOMMODATION_BILLING_PLAN_CHANGED' }
	});
});

test('a billing override invalidates even same-price checkout and late money is marked for refund', async () => {
	const { t, owner, admin, id } = await setup();
	const payment = await owner.mutation(begin, { accommodationId: id, provider: 'test-provider' });
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
		const payment = await owner.mutation(begin, { accommodationId: id, provider: 'test-provider' });
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
	const payment = await owner.mutation(begin, { accommodationId: id, provider: 'test-provider' });
	await t.mutation(apply, receipt(payment));
	await t.mutation(applyRefund, {
		provider: 'test-provider',
		providerPaymentId: 'payment-fee',
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
		provider: 'test-provider',
		providerPaymentId: 'payment-fee',
		amountMinor: 30000,
		currency: 'eur',
		refundedAmountMinor: 30000,
		refundStatus: 'succeeded'
	});
	await t.mutation(apply, { ...receipt(payment) });
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
	const old = await owner.mutation(begin, { accommodationId: id, provider: 'test-provider' });
	vi.setSystemTime(old.expiresAt + 1);
	const next = await owner.mutation(begin, { accommodationId: id, provider: 'test-provider' });
	expect(next._id).not.toBe(old._id);
	await t.mutation(apply, {
		...receipt(next),
		providerCheckoutId: 'checkout-next',
		providerPaymentId: 'payment-next'
	});
	const paid = await t.run((ctx) => ctx.db.get('accommodations', id));
	expect((await t.mutation(apply, { ...receipt(old) })).refund).toBe(true);
	await t.mutation(applyRefund, {
		provider: 'test-provider',
		providerPaymentId: 'payment-fee',
		amountMinor: 30000,
		currency: 'eur',
		refundedAmountMinor: 30000
	});
	expect(await t.run((ctx) => ctx.db.get('accommodations', id))).toEqual(paid);
});

test('payment confirmation is private and only confirms the currently applied paid period', async () => {
	const { t, owner, stranger, id } = await setup();
	const payment = await owner.mutation(begin, { accommodationId: id, provider: 'test-provider' });
	await expect(
		stranger.query(history, { accommodationId: id, paginationOpts: { numItems: 5, cursor: null } })
	).rejects.toMatchObject({ data: { code: 'FORBIDDEN' } });
	const page = await owner.query(history, {
		accommodationId: id,
		paginationOpts: { numItems: 5, cursor: null }
	});
	expect(page.items).toHaveLength(1);
	expect(page.items[0]).not.toHaveProperty('providerCheckoutId');
	expect(page.items[0]).not.toHaveProperty('providerPaymentId');
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
	expect(result).not.toHaveProperty('providerCheckoutId');
	expect(result).not.toHaveProperty('providerPaymentId');
	await t.run((ctx) =>
		ctx.db.patch('accommodationFeePayments', payment._id, { invalidated: true })
	);
	expect(await owner.query(confirmation, { paymentId: payment._id })).toMatchObject({
		status: 'paid',
		isCurrentPaidPeriod: false
	});
	await t.mutation(applyRefund, {
		provider: 'test-provider',
		providerPaymentId: 'payment-fee',
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
	for (let attempt = 0; attempt < PAYMENTS_CONFIG.checkoutCreationLimit.capacity; attempt++)
		await t.run((ctx) => limitFeeCheckoutCreation(ctx, 'host'));
	await expect(t.run((ctx) => limitFeeCheckoutCreation(ctx, 'host'))).rejects.toThrow();
	await expect(t.run((ctx) => limitFeeCheckoutCreation(ctx, 'another-host'))).resolves.toBeNull();
});

test('new attempts consume a daily owner budget even when earlier attempts failed', async () => {
	const { t, owner, id } = await setup();
	for (let attempt = 0; attempt < PAYMENTS_CONFIG.checkoutCreationLimit.capacity; attempt++) {
		const payment = await owner.mutation(begin, { accommodationId: id, provider: 'test-provider' });
		await t.run((ctx) =>
			ctx.db.patch('accommodationFeePayments', payment._id, { status: 'failed' })
		);
	}
	await expect(
		owner.mutation(begin, { accommodationId: id, provider: 'test-provider' })
	).rejects.toThrow();
	expect(await t.run((ctx) => ctx.db.query('accommodationFeePayments').collect())).toHaveLength(
		PAYMENTS_CONFIG.checkoutCreationLimit.capacity
	);
});

test('payment references and unresolved attempts are isolated by provider', async () => {
	const { t, owner, id } = await setup();
	const payment = await owner.mutation(begin, { accommodationId: id, provider: 'test-provider' });
	await expect(
		owner.mutation(begin, { accommodationId: id, provider: 'other-provider' })
	).rejects.toThrow('another provider');
	await t.mutation(apply, receipt(payment));
	await t.mutation(applyRefund, {
		provider: 'other-provider',
		providerPaymentId: 'payment-fee',
		amountMinor: 30000,
		currency: 'EUR',
		refundedAmountMinor: 30000
	});
	expect((await t.run((ctx) => ctx.db.get('accommodationFeePayments', payment._id)))?.status).toBe(
		'paid'
	);
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

function configureCheckout() {
	vi.stubEnv('CHECKOUT_API_SECRET', 'sk_sbox_test');
	vi.stubEnv('CHECKOUT_API_BASE_URL', 'https://test.api.sandbox.checkout.com');
	vi.stubEnv('CHECKOUT_PROCESSING_CHANNEL_ID', 'pc_aaaaaaaaaaaaaaaaaaaaaaaaaa');
	vi.stubEnv('PUBLIC_ORIGIN', 'https://app.example.com');
}

test('sandbox checkout uses stored prices, authorizes owners and reuses one hosted page', async () => {
	configureCheckout();
	const { owner, stranger, id, t } = await setup();
	const fetch = vi.fn().mockResolvedValue(
		new Response(
			JSON.stringify({
				id: 'hpp_test_123-456',
				_links: { redirect: { href: 'https://pay.sandbox.checkout.com/page/hpp_test_123-456' } }
			})
		)
	);
	vi.stubGlobal('fetch', fetch);
	const create = api.tables.accommodationFeePayments.actions.createFeeCheckout.createFeeCheckout;
	await expect(stranger.action(create, { accommodationId: id })).rejects.toMatchObject({
		data: { code: 'FORBIDDEN' }
	});
	const result = await owner.action(create, { accommodationId: id });
	expect(result.url).toBe('https://pay.sandbox.checkout.com/page/hpp_test_123-456');
	expect(await owner.action(create, { accommodationId: id })).toEqual(result);
	expect(fetch).toHaveBeenCalledTimes(1);
	const request = JSON.parse(fetch.mock.calls[0][1].body);
	expect(request).toMatchObject({
		amount: 30000,
		currency: 'EUR',
		capture: true,
		processing_channel_id: 'pc_aaaaaaaaaaaaaaaaaaaaaaaaaa',
		'3ds': { enabled: true }
	});
	expect(request.success_url).toContain('/host/accommodation-payment-successful?fee_payment=');
	expect(request.cancel_url).toContain('tab=billing');
	expect((await t.run((ctx) => ctx.db.get('accommodations', id)))?.billingStatus).toBe(
		'pending_payment'
	);
});

test('ambiguous hosted-page creation is not retried or duplicated', async () => {
	configureCheckout();
	const { owner, id, t } = await setup();
	const fetch = vi.fn().mockRejectedValue(new Error('Network timeout'));
	vi.stubGlobal('fetch', fetch);
	const create = api.tables.accommodationFeePayments.actions.createFeeCheckout.createFeeCheckout;
	await expect(owner.action(create, { accommodationId: id })).rejects.toThrow('Network timeout');
	await expect(owner.action(create, { accommodationId: id })).rejects.toMatchObject({
		data: { code: 'FEE_CHECKOUT_PENDING' }
	});
	expect(fetch).toHaveBeenCalledTimes(1);
	const payment = await t.run((ctx) => ctx.db.query('accommodationFeePayments').first());
	expect(payment?.checkoutRequestStartedAt).toBeDefined();
	expect(payment?.nextReconcileAt).toBeDefined();
});

test('live keys and unexpected checkout redirect hosts are rejected', () => {
	configureCheckout();
	expect(getCheckoutConfig().channelId).toBe('pc_aaaaaaaaaaaaaaaaaaaaaaaaaa');
	vi.stubEnv('CHECKOUT_API_SECRET', 'sk_live_test');
	expect(getCheckoutConfig).toThrow('sandbox configuration');
	for (const url of [
		'https://pay.checkout.com/page/test',
		'https://pay.sandbox.checkout.com.evil.example/page/test',
		'http://pay.sandbox.checkout.com/page/test',
		'https://user@pay.sandbox.checkout.com/page/test'
	])
		expect(() => validateCheckoutUrl(url)).toThrow();
});

test('definitively rejected creation permits a fresh checkout after configuration is fixed', async () => {
	configureCheckout();
	const { owner, id } = await setup();
	vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 401 })));
	const create = api.tables.accommodationFeePayments.actions.createFeeCheckout.createFeeCheckout;
	await expect(owner.action(create, { accommodationId: id })).rejects.toThrow('HTTP 401');
	vi.stubGlobal(
		'fetch',
		vi.fn().mockResolvedValue(
			new Response(
				JSON.stringify({
					id: 'hpp_fixed1234567',
					_links: { redirect: { href: 'https://pay.sandbox.checkout.com/page/hpp_fixed1234567' } }
				})
			)
		)
	);
	expect((await owner.action(create, { accommodationId: id })).url).toContain('hpp_fixed1234567');
});

test('simultaneous requests claim a hosted-page creation only once', async () => {
	configureCheckout();
	const { owner, id } = await setup();
	const fetch = vi.fn(
		async () =>
			new Response(
				JSON.stringify({
					id: 'hpp_once12345678',
					_links: { redirect: { href: 'https://pay.sandbox.checkout.com/page/hpp_once12345678' } }
				})
			)
	);
	vi.stubGlobal('fetch', fetch);
	const create = api.tables.accommodationFeePayments.actions.createFeeCheckout.createFeeCheckout;
	const results = await Promise.allSettled([
		owner.action(create, { accommodationId: id }),
		owner.action(create, { accommodationId: id })
	]);
	expect(results.some((result) => result.status === 'fulfilled')).toBe(true);
	expect(fetch).toHaveBeenCalledTimes(1);
});

test('only verified full capture activates a fee, and replays never extend it', async () => {
	configureCheckout();
	const { owner, id, t, stranger } = await setup();
	const payment = await owner.mutation(begin, {
		accommodationId: id,
		provider: 'checkout',
		providerEnvironment: 'sandbox',
		providerAccountId: 'pc_aaaaaaaaaaaaaaaaaaaaaaaaaa'
	});
	await t.mutation(
		internal.tables.accommodationFeePayments.mutations.saveFeeCheckout.saveFeeCheckout,
		{
			paymentId: payment._id,
			provider: 'checkout',
			providerCheckoutId: 'hpp_test_123-456',
			url: 'https://pay.sandbox.checkout.com/page/hpp_test_123-456'
		}
	);
	let captured = 0;
	vi.stubGlobal(
		'fetch',
		vi.fn(
			async (url: string) =>
				new Response(
					JSON.stringify(
						url.includes('/hosted-payments/')
							? {
									id: 'hpp_test_123-456',
									amount: 30000,
									currency: 'EUR',
									reference: payment._id,
									payment_id: 'pay_aaaaaaaaaaaaaaaaaaaaaaaaaa',
									status: 'Payment Received'
								}
							: {
									id: 'pay_aaaaaaaaaaaaaaaaaaaaaaaaaa',
									amount: 30000,
									currency: 'EUR',
									reference: payment._id,
									status: captured ? 'Captured' : 'Authorized',
									balances: { total_captured: captured, total_refunded: 0 }
								}
					)
				)
		)
	);
	const refresh = api.tables.accommodationFeePayments.actions.refreshFeePayment.refreshFeePayment;
	await expect(stranger.action(refresh, { paymentId: payment._id })).rejects.toMatchObject({
		data: { code: 'FORBIDDEN' }
	});
	await owner.action(refresh, { paymentId: payment._id });
	expect((await t.run((ctx) => ctx.db.get('accommodations', id)))?.billingStatus).toBe(
		'pending_payment'
	);
	captured = 30000;
	await owner.action(refresh, { paymentId: payment._id });
	const paid = await t.run((ctx) => ctx.db.get('accommodations', id));
	expect(paid?.billingStatus).toBe('active');
	vi.setSystemTime(Date.now() + 60000);
	await owner.action(refresh, { paymentId: payment._id });
	expect((await t.run((ctx) => ctx.db.get('accommodations', id)))?.billingPeriodEndsAt).toBe(
		paid?.billingPeriodEndsAt
	);
});

test('provider amount mismatch cannot activate a listing', async () => {
	configureCheckout();
	const { owner, id, t } = await setup();
	const payment = await owner.mutation(begin, {
		accommodationId: id,
		provider: 'checkout',
		providerEnvironment: 'sandbox',
		providerAccountId: 'pc_aaaaaaaaaaaaaaaaaaaaaaaaaa'
	});
	await t.mutation(
		internal.tables.accommodationFeePayments.mutations.saveFeeCheckout.saveFeeCheckout,
		{
			paymentId: payment._id,
			provider: 'checkout',
			providerCheckoutId: 'hpp_test_123-456',
			url: null
		}
	);
	vi.stubGlobal(
		'fetch',
		vi.fn().mockResolvedValue(
			new Response(
				JSON.stringify({
					id: 'hpp_test_123-456',
					amount: 1,
					currency: 'EUR',
					reference: payment._id,
					status: 'Payment Received',
					payment_id: 'pay_aaaaaaaaaaaaaaaaaaaaaaaaaa'
				})
			)
		)
	);
	await expect(
		owner.action(api.tables.accommodationFeePayments.actions.refreshFeePayment.refreshFeePayment, {
			paymentId: payment._id
		})
	).rejects.toThrow('recorded fee');
	expect((await t.run((ctx) => ctx.db.get('accommodations', id)))?.billingStatus).toBe(
		'pending_payment'
	);
});

test('late captured payments are refunded idempotently without granting access', async () => {
	configureCheckout();
	const { owner, id, t } = await setup();
	const payment = await owner.mutation(begin, {
		accommodationId: id,
		provider: 'checkout',
		providerEnvironment: 'sandbox',
		providerAccountId: 'pc_aaaaaaaaaaaaaaaaaaaaaaaaaa'
	});
	await t.mutation(
		internal.tables.accommodationFeePayments.mutations.saveFeeCheckout.saveFeeCheckout,
		{
			paymentId: payment._id,
			provider: 'checkout',
			providerCheckoutId: 'hpp_test_123-456',
			url: null
		}
	);
	await t.run((ctx) =>
		ctx.db.patch('accommodationFeePayments', payment._id, { invalidated: true })
	);
	let refunded = 0;
	let refundRequestFailed = false;
	const fetch = vi.fn(async (url: string, init?: RequestInit) => {
		if (init?.method === 'POST') {
			if (!refundRequestFailed) {
				refundRequestFailed = true;
				throw new Error('Refund response lost');
			}
			return new Response(JSON.stringify({ action_id: 'act_refund' }), { status: 202 });
		}
		if (url.endsWith('/actions'))
			return new Response(JSON.stringify([{ id: 'act_refund', type: 'Refund', approved: true }]));
		return new Response(
			JSON.stringify(
				url.includes('/hosted-payments/')
					? {
							id: 'hpp_test_123-456',
							amount: 30000,
							currency: 'EUR',
							reference: payment._id,
							payment_id: 'pay_aaaaaaaaaaaaaaaaaaaaaaaaaa',
							status: 'Payment Received'
						}
					: {
							id: 'pay_aaaaaaaaaaaaaaaaaaaaaaaaaa',
							amount: 30000,
							currency: 'EUR',
							reference: payment._id,
							status: 'Captured',
							balances: { total_captured: 30000, total_refunded: refunded }
						}
			)
		);
	});
	vi.stubGlobal('fetch', fetch);
	const refresh = api.tables.accommodationFeePayments.actions.refreshFeePayment.refreshFeePayment;
	await expect(owner.action(refresh, { paymentId: payment._id })).rejects.toThrow(
		'Refund response lost'
	);
	expect(
		(await t.run((ctx) => ctx.db.get('accommodationFeePayments', payment._id)))?.nextReconcileAt
	).toBeDefined();
	await owner.action(refresh, { paymentId: payment._id });
	await owner.action(refresh, { paymentId: payment._id });
	const posts = fetch.mock.calls.filter((call) => call[1]?.method === 'POST');
	expect(posts).toHaveLength(2);
	expect(new Headers(posts[0][1]?.headers).get('Cko-Idempotency-Key')).toBe(
		`fee-refund-${payment._id}-1`
	);
	expect(posts[1][1]?.body).toBe(posts[0][1]?.body);
	expect(new Headers(posts[1][1]?.headers).get('Cko-Idempotency-Key')).toBe(
		`fee-refund-${payment._id}-1`
	);
	expect((await t.run((ctx) => ctx.db.get('accommodations', id)))?.billingStatus).toBe(
		'pending_payment'
	);
	expect((await t.run((ctx) => ctx.db.get('accommodationFeePayments', payment._id)))?.status).toBe(
		'refund_pending'
	);
	refunded = 30000;
	await owner.action(refresh, { paymentId: payment._id });
	expect((await t.run((ctx) => ctx.db.get('accommodationFeePayments', payment._id)))?.status).toBe(
		'refunded'
	);
});

test('webhooks authenticate the raw body and deduplicate scheduling', async () => {
	configureCheckout();
	vi.stubEnv('CHECKOUT_WEBHOOK_SECRET', 'webhook-test-secret');
	const { owner, id, t } = await setup();
	const payment = await owner.mutation(begin, {
		accommodationId: id,
		provider: 'checkout',
		providerEnvironment: 'sandbox',
		providerAccountId: 'pc_aaaaaaaaaaaaaaaaaaaaaaaaaa'
	});
	const body = JSON.stringify({
		id: 'evt_test',
		type: 'payment_captured',
		data: { reference: payment._id }
	});
	const bytes = new TextEncoder().encode(body);
	const key = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode('webhook-test-secret'),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const signature = Array.from(
		new Uint8Array(await crypto.subtle.sign('HMAC', key, bytes)),
		(byte) => byte.toString(16).padStart(2, '0')
	).join('');
	expect(await verifyCheckoutSignature(bytes.buffer, signature, 'webhook-test-secret')).toBe(true);
	expect(
		await verifyCheckoutSignature(
			new TextEncoder().encode(body + ' ').buffer,
			signature,
			'webhook-test-secret'
		)
	).toBe(false);
	expect((await t.fetch('/checkout-webhook', { method: 'POST', body })).status).toBe(401);
	for (let attempt = 0; attempt < 2; attempt++)
		expect(
			(
				await t.fetch('/checkout-webhook', {
					method: 'POST',
					body,
					headers: { 'Cko-Signature': signature }
				})
			).status
		).toBe(200);
	expect(await t.run((ctx) => ctx.db.query('checkoutWebhookEvents').collect())).toHaveLength(1);
	await t.run((ctx) =>
		ctx.db.patch('accommodationFeePayments', payment._id, {
			providerPaymentId: 'pay_aaaaaaaaaaaaaaaaaaaaaaaaaa'
		})
	);
	await t.mutation(internal.checkout.mutations.queueWebhook.queueWebhook, {
		eventId: 'evt_refund',
		providerPaymentId: 'pay_aaaaaaaaaaaaaaaaaaaaaaaaaa'
	});
	expect(await t.run((ctx) => ctx.db.query('checkoutWebhookEvents').collect())).toHaveLength(2);
});
