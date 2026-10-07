/// <reference types="vite/client" />

// LIBRARIES
import actionRetrierTest from '@convex-dev/action-retrier/test';
import aggregateTest from '@convex-dev/aggregate/test';
import r2Test from '@convex-dev/r2/test';
import rateLimiterTest from '@convex-dev/rate-limiter/test';
import { expect, test, vi } from 'vitest';
import { convexTest } from 'convex-test';
import {
	defineSchema,
	defineTable,
	type FunctionArgs,
	type FunctionReturnType
} from 'convex/server';
import { v } from 'convex/values';

// CONVEX
import { api, internal } from '../../src/convex/_generated/api.js';

// AGGREGATES
import { accommodationOwnerAggregate } from '../../src/convex/tables/accommodations/aggregates/accommodationOwnerAggregate.js';
import { reviewAggregate } from '../../src/convex/tables/reviews/aggregates/reviewAggregate.js';

// CONFIG
import * as accommodationConfig from '../../src/shared/features/accommodations/config.js';
import {
	ACCOMMODATION_CONFIG,
	ACCOMMODATION_BILLING_PLANS
} from '../../src/shared/features/accommodations/config.js';

// DATA
import { AMENITY_KEYS } from '../../src/shared/features/accommodations/data/accommodationsData.js';

// SCHEMAS
import schema, { tables } from '../../src/convex/schema.js';
import { accommodations } from '../../src/convex/tables/accommodations/schema.js';
import {
	bookings,
	bookingCancellationTerms as termsValidator
} from '../../src/convex/tables/bookings/schema.js';
import {
	accommodationSectionSchemas,
	adminAccommodationsFeeDialogFormSchema,
	createAccommodationSchema,
	saveAccommodationSchema,
	type AccommodationDetails,
	type AccommodationSearchFilters
} from '../../src/shared/features/accommodations/schemas/accommodationSchemas.js';
import { cancellationPolicySchema } from '../../src/shared/features/accommodations/schemas/cancellationPolicySchemas.js';

// FIXTURES
import { bookingCancellationTerms } from '../fixtures/bookingCancellationTerms.js';
import { bookingFeeBilling } from '../fixtures/accommodationBilling.js';

test('admin fee drafts validate the selected plan, money precision and required expiry', () => {
	const booking = { id: 'accommodation', plan: 'booking_fee', commission: 10 };
	expect(
		adminAccommodationsFeeDialogFormSchema.safeParse({
			...booking,
			amount: undefined,
			deadline: 'invalid'
		}).success
	).toBe(true);
	for (const commission of [0, 12.5, 100])
		expect(
			adminAccommodationsFeeDialogFormSchema.safeParse({ ...booking, commission }).success
		).toBe(true);
	for (const commission of [undefined, -1, 100.01, 0.001, Number.NaN])
		expect(
			adminAccommodationsFeeDialogFormSchema.safeParse({ ...booking, commission }).success
		).toBe(false);

	const flat = {
		id: 'accommodation',
		plan: 'flat_fee',
		amount: 300,
		months: 3,
		status: 'pending_payment',
		deadline: ''
	};
	expect(adminAccommodationsFeeDialogFormSchema.safeParse(flat).success).toBe(true);
	for (const amount of [undefined, 0, -1, 0.001, Number.NaN])
		expect(adminAccommodationsFeeDialogFormSchema.safeParse({ ...flat, amount }).success).toBe(
			false
		);
	for (const months of [undefined, 0, 1.5, 121])
		expect(adminAccommodationsFeeDialogFormSchema.safeParse({ ...flat, months }).success).toBe(
			false
		);
	expect(
		adminAccommodationsFeeDialogFormSchema.safeParse({ ...flat, status: 'invalid' }).success
	).toBe(false);

	vi.useFakeTimers();
	vi.setSystemTime(new Date('2026-10-07T12:00:00Z'));
	try {
		expect(
			adminAccommodationsFeeDialogFormSchema.safeParse({
				...flat,
				status: 'active',
				deadline: '2027-01-01T12:00'
			}).success
		).toBe(true);
		const free = { id: 'accommodation', plan: 'free', forever: false };
		expect(
			adminAccommodationsFeeDialogFormSchema.safeParse({ ...free, deadline: '2027-01-01T12:00' })
				.success
		).toBe(true);
		expect(
			adminAccommodationsFeeDialogFormSchema.safeParse({ ...free, forever: true, deadline: '' })
				.success
		).toBe(true);
		for (const deadline of ['', 'invalid', '2020-01-01T12:00', '2027-02-30T12:00']) {
			expect(
				adminAccommodationsFeeDialogFormSchema.safeParse({ ...flat, status: 'active', deadline })
					.success
			).toBe(false);
			expect(adminAccommodationsFeeDialogFormSchema.safeParse({ ...free, deadline }).success).toBe(
				false
			);
		}
	} finally {
		vi.useRealTimers();
	}
	expect(
		adminAccommodationsFeeDialogFormSchema.safeParse({ ...booking, plan: 'invalid' }).success
	).toBe(false);
});

test('cancellation policies allow only fixed percentages and every decreasing or equal schedule', () => {
	expect(cancellationPolicySchema.parse(ACCOMMODATION_CONFIG.CANCELLATION_DEFAULT_POLICY)).toEqual(
		ACCOMMODATION_CONFIG.CANCELLATION_DEFAULT_POLICY
	);
	for (const fiveToSevenDays of ACCOMMODATION_CONFIG.CANCELLATION_REFUND_PERCENTAGES)
		for (const threeToFiveDays of ACCOMMODATION_CONFIG.CANCELLATION_REFUND_PERCENTAGES)
			for (const oneToThreeDays of ACCOMMODATION_CONFIG.CANCELLATION_REFUND_PERCENTAGES)
				for (const under24Hours of ACCOMMODATION_CONFIG.CANCELLATION_REFUND_PERCENTAGES) {
					const result = cancellationPolicySchema.safeParse({
						version: 1,
						mode: 'custom',
						fiveToSevenDays,
						threeToFiveDays,
						oneToThreeDays,
						under24Hours
					});
					const isDecreasing =
						fiveToSevenDays >= threeToFiveDays &&
						threeToFiveDays >= oneToThreeDays &&
						oneToThreeDays >= under24Hours;
					expect(result.success).toBe(isDecreasing);
				}
	const custom = {
		version: 1,
		mode: 'custom',
		fiveToSevenDays: 100,
		threeToFiveDays: 100,
		oneToThreeDays: 100,
		under24Hours: 100
	};
	for (const range of ACCOMMODATION_CONFIG.CANCELLATION_POLICY_RANGES) {
		for (const value of [25, 75, -1, 101, 50.5, '50', null, undefined, Number.NaN]) {
			expect(cancellationPolicySchema.safeParse({ ...custom, [range]: value }).success).toBe(false);
		}
	}
	for (const policy of [
		undefined,
		null,
		{},
		{ ...custom, version: 2 },
		{ ...custom, mode: 'unknown' }
	]) {
		expect(cancellationPolicySchema.safeParse(policy).success).toBe(false);
	}
	const increasing = cancellationPolicySchema.safeParse({ ...custom, threeToFiveDays: 0 });
	expect(increasing.success).toBe(false);
	if (!increasing.success) expect(increasing.error.issues[0].path).toEqual(['oneToThreeDays']);
	expect(cancellationPolicySchema.parse({ ...custom, mode: 'full_refund' })).toEqual(
		ACCOMMODATION_CONFIG.CANCELLATION_DEFAULT_POLICY
	);
});

const emptyListing: AccommodationDetails = {
	weekendPrice: null,
	discountPercent: 0,
	supportedPaymentMethods: 'cash',
	bookingMode: 'request',
	sameDayReservation: false,
	imageKeys: [],
	name: '',
	description: '',
	type: 'apartment',
	spaceType: 'entire',
	latitude: 44.8176,
	longitude: 20.4569,
	address: { street: '', streetNumber: '', city: '', postalCode: '', country: 'Serbia' },
	maxGuests: 2,
	bedrooms: 1,
	beds: 1,
	bathrooms: 1,
	nightlyPrice: 0,
	amenities: [],
	checkInStart: '14:00',
	timeZone: 'Europe/Belgrade',
	checkInEnd: '22:00',
	checkOut: '11:00',
	minimumStay: 1,
	smokingAllowed: false,
	petsAllowed: false,
	partiesAllowed: false,
	houseRules: '',
	cancellationPolicy: ACCOMMODATION_CONFIG.CANCELLATION_DEFAULT_POLICY
};

const modules = import.meta.glob('../../src/convex/**/*.ts');
const imageKeys = ['cover', 'bedroom', 'kitchen', 'bathroom', 'living-room'];
const listing = {
	...emptyListing,
	billingPlanId: 'booking_fee' as const,
	name: 'Central apartment',
	description: 'A comfortable and bright apartment near the city centre.',
	address: { street: 'Knez Mihailova', streetNumber: '10A', city: 'Belgrade', country: 'Serbia' },
	nightlyPrice: 80.25,
	imageKeys
};

test('billing plans control initial visibility and cannot be bypassed through listing edits', async () => {
	const t = setup();
	const host = t.withIdentity({ subject: 'host', tokenIdentifier: 'issuer|host' });
	const stranger = t.withIdentity({ subject: 'stranger', tokenIdentifier: 'issuer|stranger' });
	const create = api.tables.accommodations.mutations.createAccommodation.createAccommodation;
	const update = api.tables.accommodations.mutations.updateAccommodation.updateAccommodation;
	const publish =
		api.tables.accommodations.mutations.updateAccommodationPublishStatus
			.updateAccommodationPublishStatus;
	const detail =
		api.tables.accommodations.queries.fetchPublicAccommodation.fetchPublicAccommodation;
	const { billingPlanId: _plan, ...withoutPlan } = listing;
	expect(createAccommodationSchema.safeParse(withoutPlan).success).toBe(false);
	expect(
		createAccommodationSchema.safeParse({ ...listing, billingPlanId: 'unknown' }).success
	).toBe(false);

	const ids = [];
	for (const billingPlanId of ['flat_fee', 'booking_fee'] as const) {
		const keys = imageKeys.map((key) => `${billingPlanId}-${key}`);
		await t.run(async (ctx) => {
			for (const key of keys)
				await ctx.db.insert('storageUploads', {
					ownerId: 'host',
					key,
					status: 'uploaded',
					createdAt: Date.now()
				});
		});
		ids.push(
			await host.mutation(create, {
				...listing,
				billingPlanId,
				imageKeys: keys,
				uploadedFiles: keys
			})
		);
	}
	const [flatId, bookingId] = ids;
	const unpaid = await t.run((ctx) => ctx.db.get('accommodations', flatId));
	expect(unpaid).toMatchObject({
		status: 'published',
		billingStatus: 'pending_payment',
		billingPlanId: 'flat_fee',
		billingTerms: { model: 'flat_fee', amountMinor: 30000, currency: 'EUR', intervalMonths: 3 }
	});
	expect(await detailQuery(flatId)).toBeNull();
	const publicBookingFee = await detailQuery(bookingId);
	expect(publicBookingFee?.status).toBe('published');
	expect(publicBookingFee).not.toHaveProperty('billingTerms');
	expect(publicBookingFee).not.toHaveProperty('billingPlanId');
	expect(publicBookingFee).not.toHaveProperty('billingStatus');
	await host.mutation(publish, { id: flatId, status: 'unpublished' });
	await host.mutation(publish, { id: flatId, status: 'published' });
	expect(await detailQuery(flatId)).toBeNull();
	await expect(
		stranger.mutation(publish, { id: flatId, status: 'published' })
	).rejects.toMatchObject({ data: { code: 'FORBIDDEN' } });
	await host.mutation(update, { id: flatId, houseRules: 'No parties' });
	expect(await t.run((ctx) => ctx.db.get('accommodations', flatId))).toMatchObject({
		billingTerms: unpaid?.billingTerms,
		billingStatus: 'pending_payment',
		status: 'published'
	});
	const forgedUpdate = {
		id: flatId,
		billingStatus: 'active',
		billingPlanId: 'booking_fee',
		billingTerms: { model: 'flat_fee', amountMinor: 1, currency: 'EUR', intervalMonths: 3 }
	};
	await expect(host.mutation(update, forgedUpdate)).rejects.toThrow();
	const forgedCreation = {
		...listing,
		billingStatus: 'active',
		billingTerms: forgedUpdate.billingTerms
	};
	await expect(host.mutation(create, forgedCreation)).rejects.toThrow();
	const args = { location: { country: 'Serbia' }, paginationOpts: { cursor: null, numItems: 10 } };
	const search = await t.query(
		api.tables.accommodations.queries.fetchAccommodationsSearch.fetchAccommodationsSearch,
		args
	);
	expect(search.items.map((item) => item._id)).toEqual([bookingId]);
	expect(search.items[0]).not.toHaveProperty('billingTerms');
	const map = await t.query(
		api.tables.accommodations.queries.fetchAccommodationsMapSearch.fetchAccommodationsMap,
		args
	);
	expect(map.items.map((item) => item._id)).toEqual([bookingId]);
	const ownerList = await host.query(
		api.tables.accommodations.queries.fetchMyAccommodations.fetchMyAccommodations,
		{ paginationOpts: args.paginationOpts }
	);
	expect(ownerList.items).toHaveLength(2);
	expect(ownerList.items.find((item) => item._id === flatId)).toMatchObject({
		billingStatus: 'pending_payment',
		billingTerms: unpaid?.billingTerms
	});
	await host.mutation(publish, { id: bookingId, status: 'unpublished' });
	await host.mutation(publish, { id: bookingId, status: 'published' });
	expect((await t.run((ctx) => ctx.db.get('accommodations', bookingId)))?.billingStatus).toBe(
		'active'
	);

	function detailQuery(id: typeof flatId) {
		return t.query(detail, { id });
	}
});

test('fee settings enforce ownership, hide unpaid switches, preserve pauses and lock paid periods', async () => {
	const t = setup();
	const owner = t.withIdentity({ subject: 'host', tokenIdentifier: 'issuer|host' });
	const stranger = t.withIdentity({ subject: 'other', tokenIdentifier: 'issuer|other' });
	const change =
		api.tables.accommodations.mutations.changeAccommodationBillingPlan
			.changeAccommodationBillingPlan;
	const settings =
		api.tables.accommodations.queries.fetchMyAccommodationSettings.fetchMyAccommodationSettings;
	const publish =
		api.tables.accommodations.mutations.updateAccommodationPublishStatus
			.updateAccommodationPublishStatus;
	const publicDetail =
		api.tables.accommodations.queries.fetchPublicAccommodation.fetchPublicAccommodation;
	const {
		nightlyPrice: _nightlyPrice,
		discountPercent: _discount,
		weekendPrice: _weekend,
		...details
	} = listing;
	const id = await t.run((ctx) =>
		ctx.db.insert('accommodations', {
			...bookingFeeBilling,
			...details,
			ownerId: 'host',
			pricePerNightMinor: 8025,
			discountBps: 0,
			weekendPricePerNightMinor: null,
			effectivePricePerNightMinor: 8025,
			recommendationSortKey: -3,
			guestRatingAverage: 0,
			guestReviewCount: 0,
			status: 'published',
			updatedAt: 1
		})
	);
	expect(await stranger.query(settings, { id })).toBeNull();
	await expect(t.query(settings, { id })).rejects.toMatchObject({
		data: { code: 'UNAUTHENTICATED' }
	});
	await expect(
		stranger.mutation(change, {
			id,
			billingPlanId: 'flat_fee',
			expectedBillingPlanId: 'booking_fee'
		})
	).rejects.toMatchObject({ data: { code: 'FORBIDDEN' } });
	await owner.mutation(change, {
		id,
		billingPlanId: 'flat_fee',
		expectedBillingPlanId: 'booking_fee'
	});
	expect((await owner.query(settings, { id }))?.billing).toMatchObject({
		billingPlanId: 'flat_fee',
		billingStatus: 'pending_payment',
		billingPeriodEndsAt: null,
		status: 'published',
		billingTerms: ACCOMMODATION_BILLING_PLANS.flat_fee
	});
	expect(await t.query(publicDetail, { id })).toBeNull();
	await owner.mutation(publish, { id, status: 'published' });
	expect(await t.query(publicDetail, { id })).toBeNull();
	await expect(
		owner.mutation(change, {
			id,
			billingPlanId: 'booking_fee',
			expectedBillingPlanId: 'booking_fee'
		})
	).rejects.toMatchObject({ data: { code: 'ACCOMMODATION_BILLING_PLAN_CHANGED' } });
	await owner.mutation(change, {
		id,
		billingPlanId: 'booking_fee',
		expectedBillingPlanId: 'flat_fee'
	});
	expect((await owner.query(settings, { id }))?.billing).toMatchObject({
		billingPlanId: 'booking_fee',
		status: 'published'
	});
	const guestListing = await t.query(publicDetail, { id });
	expect(guestListing).not.toHaveProperty('billingPeriodEndsAt');
	await owner.mutation(publish, { id, status: 'unpublished' });
	await owner.mutation(change, {
		id,
		billingPlanId: 'flat_fee',
		expectedBillingPlanId: 'booking_fee'
	});
	await owner.mutation(change, {
		id,
		billingPlanId: 'booking_fee',
		expectedBillingPlanId: 'flat_fee'
	});
	expect((await owner.query(settings, { id }))?.billing).toMatchObject({
		status: 'unpublished'
	});
	const end = Date.now() + 60000;
	await t.run((ctx) =>
		ctx.db.patch('accommodations', id, {
			billingPlanId: 'flat_fee',
			billingTerms: ACCOMMODATION_BILLING_PLANS.flat_fee,
			billingStatus: 'active',
			billingPeriodEndsAt: end
		})
	);
	await expect(
		owner.mutation(change, { id, billingPlanId: 'booking_fee', expectedBillingPlanId: 'flat_fee' })
	).rejects.toMatchObject({ data: { code: 'ACCOMMODATION_BILLING_PLAN_LOCKED' } });
	await owner.mutation(publish, { id, status: 'published' });
	expect(await t.query(publicDetail, { id })).not.toBeNull();
	const searchArgs = {
		location: { country: 'Serbia' },
		paginationOpts: { cursor: null, numItems: 10 }
	};
	const searchQuery =
		api.tables.accommodations.queries.fetchAccommodationsSearch.fetchAccommodationsSearch;
	const mapQuery =
		api.tables.accommodations.queries.fetchAccommodationsMapSearch.fetchAccommodationsMap;
	expect((await t.query(searchQuery, searchArgs)).items.map((item) => item._id)).toContain(id);
	expect((await t.query(mapQuery, searchArgs)).items.map((item) => item._id)).toContain(id);
	const favorite = api.tables.favorites.mutations.updateFavoriteStatus.updateFavoriteStatus;
	await stranger.mutation(favorite, { accommodationId: id, favorite: true });
	await t.run((ctx) => ctx.db.patch('accommodations', id, { billingPeriodEndsAt: null }));
	expect(await t.query(publicDetail, { id })).toBeNull();
	expect((await t.query(searchQuery, searchArgs)).items).toHaveLength(0);
	await t.run((ctx) => ctx.db.patch('accommodations', id, { billingPeriodEndsAt: end }));
	const before = await t.run((ctx) => ctx.db.get('accommodations', id));
	await owner.mutation(change, {
		id,
		billingPlanId: 'flat_fee',
		expectedBillingPlanId: 'flat_fee'
	});
	expect(await t.run((ctx) => ctx.db.get('accommodations', id))).toEqual(before);
	await t.run((ctx) => ctx.db.patch('accommodations', id, { billingPeriodEndsAt: Date.now() }));
	expect((await t.query(searchQuery, searchArgs)).items).toHaveLength(0);
	expect((await t.query(mapQuery, searchArgs)).items).toHaveLength(0);
	await expect(
		stranger.mutation(favorite, { accommodationId: id, favorite: true })
	).rejects.toMatchObject({ data: { code: 'ACCOMMODATION_NOT_FOUND' } });
	await expect(
		t.mutation(api.tables.bookings.mutations.createBooking.createBooking, {
			accommodationId: id,
			paymentMethod: 'cash',
			expectedPricePerNightMinor: 8025,
			expectedTotalMinor: 8025,
			checkInDate: '2099-01-01',
			checkOutDate: '2099-01-02',
			adults: 1,
			children: 0,
			firstName: 'Guest',
			lastName: 'Test',
			email: 'guest@example.com',
			phone: '+381641234567'
		})
	).rejects.toMatchObject({ data: { code: 'ACCOMMODATION_NOT_FOUND' } });
	await owner.mutation(publish, { id, status: 'published' });
	expect(await t.query(publicDetail, { id })).toBeNull();
	await owner.mutation(change, {
		id,
		billingPlanId: 'booking_fee',
		expectedBillingPlanId: 'flat_fee'
	});
	expect((await owner.query(settings, { id }))?.billing).toMatchObject({
		billingPeriodEndsAt: null,
		status: 'published'
	});
	await t.run((ctx) => ctx.db.patch('accommodations', id, { status: 'deleted' }));
	expect(await owner.query(settings, { id })).toBeNull();
	await expect(
		owner.mutation(change, { id, billingPlanId: 'flat_fee', expectedBillingPlanId: 'booking_fee' })
	).rejects.toMatchObject({ data: { code: 'ACCOMMODATION_NOT_FOUND' } });
});

test('simulated flat-fee payment grants calendar months, preserves pauses, locks switching and expires safely', async () => {
	vi.useFakeTimers();
	vi.setSystemTime(new Date('2026-01-31T12:34:56.789Z'));
	const t = setup();
	const owner = t.withIdentity({ subject: 'host', tokenIdentifier: 'issuer|host' });
	const stranger = t.withIdentity({ subject: 'other', tokenIdentifier: 'issuer|other' });
	const {
		nightlyPrice: _price,
		discountPercent: _discount,
		weekendPrice: _weekend,
		...details
	} = listing;
	const id = await t.run((ctx) =>
		ctx.db.insert('accommodations', {
			...details,
			...bookingFeeBilling,
			ownerId: 'host',
			status: 'unpublished',
			billingPlanId: 'flat_fee',
			billingTerms: ACCOMMODATION_BILLING_PLANS.flat_fee,
			billingStatus: 'pending_payment',
			pricePerNightMinor: 8025,
			discountBps: 0,
			weekendPricePerNightMinor: null,
			effectivePricePerNightMinor: 8025,
			recommendationSortKey: -3,
			guestRatingAverage: 0,
			guestReviewCount: 0,
			updatedAt: 1
		})
	);
	const pay = api.tables.accommodations.mutations.payFlatFeeAccommodation.payFlatFeeAccommodation;
	const expire =
		internal.tables.accommodations.mutations.expireFlatFeeAccommodation.expireFlatFeeAccommodation;
	const change =
		api.tables.accommodations.mutations.changeAccommodationBillingPlan
			.changeAccommodationBillingPlan;
	const publicDetail =
		api.tables.accommodations.queries.fetchPublicAccommodation.fetchPublicAccommodation;
	try {
		vi.spyOn(accommodationConfig, 'ACCOMMODATION_PAYMENT_SIMULATION', 'get').mockReturnValue(false);
		await expect(owner.mutation(pay, { id })).rejects.toMatchObject({
			data: { code: 'ACCOMMODATION_PAYMENT_SIMULATION_DISABLED' }
		});
		vi.restoreAllMocks();
		await expect(t.mutation(pay, { id })).rejects.toMatchObject({
			data: { code: 'UNAUTHENTICATED' }
		});
		await expect(stranger.mutation(pay, { id })).rejects.toMatchObject({
			data: { code: 'FORBIDDEN' }
		});
		await owner.mutation(pay, { id });
		const end = Date.parse('2026-04-30T12:34:56.789Z');
		const paid = await t.run((ctx) => ctx.db.get('accommodations', id));
		expect(paid).toMatchObject({
			billingStatus: 'active',
			billingPeriodEndsAt: end,
			status: 'unpublished'
		});
		expect(await t.query(publicDetail, { id })).toBeNull();
		await owner.mutation(pay, { id });
		expect(await t.run((ctx) => ctx.db.get('accommodations', id))).toEqual(paid);
		await expect(
			owner.mutation(change, {
				id,
				billingPlanId: 'booking_fee',
				expectedBillingPlanId: 'flat_fee'
			})
		).rejects.toMatchObject({ data: { code: 'ACCOMMODATION_BILLING_PLAN_LOCKED' } });
		await owner.mutation(
			api.tables.accommodations.mutations.updateAccommodationPublishStatus
				.updateAccommodationPublishStatus,
			{ id, status: 'published' }
		);
		expect(await t.query(publicDetail, { id })).not.toBeNull();
		// An early job cannot end the term.
		await t.mutation(expire, { id, billingPeriodEndsAt: end });
		expect((await t.run((ctx) => ctx.db.get('accommodations', id)))?.billingStatus).toBe('active');
		// Simulate a renewed term before the old scheduled job executes.
		const renewedEnd = Date.parse('2026-07-30T12:34:56.789Z');
		await t.run((ctx) => ctx.db.patch('accommodations', id, { billingPeriodEndsAt: renewedEnd }));
		vi.setSystemTime(end);
		await t.finishAllScheduledFunctions(() => vi.runAllTimersAsync());
		expect((await t.run((ctx) => ctx.db.get('accommodations', id)))?.billingStatus).toBe('active');
		vi.setSystemTime(renewedEnd);
		await t.mutation(expire, { id, billingPeriodEndsAt: renewedEnd });
		expect(await t.run((ctx) => ctx.db.get('accommodations', id))).toMatchObject({
			billingStatus: 'pending_payment',
			billingPeriodEndsAt: renewedEnd,
			status: 'published'
		});
		expect(await t.query(publicDetail, { id })).toBeNull();
		// Expired periods can be paid again and obtain a fresh term.
		await owner.mutation(pay, { id });
		expect((await t.run((ctx) => ctx.db.get('accommodations', id)))?.billingPeriodEndsAt).toBe(
			Date.parse('2026-10-30T12:34:56.789Z')
		);
		vi.setSystemTime(Date.parse('2026-10-30T12:34:56.789Z'));
		await t.finishAllScheduledFunctions(() => vi.runAllTimersAsync());
		await owner.mutation(change, {
			id,
			billingPlanId: 'booking_fee',
			expectedBillingPlanId: 'flat_fee'
		});
		await expect(owner.mutation(pay, { id })).rejects.toMatchObject({
			data: { code: 'ACCOMMODATION_BILLING_PLAN_CHANGED' }
		});
		await t.run((ctx) => ctx.db.patch('accommodations', id, { status: 'deleted' }));
		await expect(owner.mutation(pay, { id })).rejects.toMatchObject({
			data: { code: 'ACCOMMODATION_NOT_FOUND' }
		});
	} finally {
		vi.useRealTimers();
		vi.restoreAllMocks();
	}
});

test('publication migration restores host choices, preserves deletion and is safe to rerun', async () => {
	const legacySchema = defineSchema({
		...tables,
		accommodations: defineTable(
			accommodations.validator.extend({
				publicationIntent: v.optional(v.union(v.literal('published'), v.literal('unpublished')))
			})
		)
	});
	const t = convexTest(legacySchema, modules);
	const {
		nightlyPrice: _price,
		discountPercent: _discount,
		weekendPrice: _weekend,
		...details
	} = listing;
	const rows = [
		{ status: 'unpublished', publicationIntent: 'published', expected: 'published' },
		{ status: 'unpublished', publicationIntent: 'unpublished', expected: 'unpublished' },
		{ status: 'deleted', publicationIntent: 'published', expected: 'deleted' }
	] as const;
	const ids = await t.run(async (ctx) =>
		Promise.all(
			rows.map((row) =>
				ctx.db.insert('accommodations', {
					...details,
					...bookingFeeBilling,
					ownerId: 'host',
					status: row.status,
					publicationIntent: row.publicationIntent,
					billingPlanId: 'flat_fee',
					billingTerms: ACCOMMODATION_BILLING_PLANS.flat_fee,
					billingStatus: 'pending_payment',
					pricePerNightMinor: 8025,
					discountBps: 0,
					weekendPricePerNightMinor: null,
					effectivePricePerNightMinor: 8025,
					recommendationSortKey: -3,
					guestRatingAverage: 0,
					guestReviewCount: 0,
					updatedAt: 1
				})
			)
		)
	);
	const migration =
		internal.migrations.migrateAccommodationPublicationStatus.migrateAccommodationPublicationStatus;
	const args = { cursor: null, batchSize: 2, oneBatchOnly: true, dryRun: false };
	for (let run = 0; run < 2; run++) {
		let page = await t.mutation(migration, args);
		while (!page.isDone)
			page = await t.mutation(migration, { ...args, cursor: page.continueCursor });
	}
	const results = await t.run((ctx) =>
		Promise.all(ids.map((id) => ctx.db.get('accommodations', id)))
	);
	for (const [index, result] of results.entries()) {
		expect(result?.status).toBe(rows[index].expected);
		expect(result?.billingStatus).toBe('pending_payment');
		expect(result?.updatedAt).toBe(1);
		expect(result).not.toHaveProperty('publicationIntent');
	}
});

test('billing backfill fills legacy listings across pages and preserves existing choices on reruns', async () => {
	const legacySchema = defineSchema({
		...tables,
		accommodations: defineTable(
			accommodations.validator.omit('billingPlanId', 'billingTerms', 'billingStatus').extend({
				...accommodations.validator.pick('billingPlanId', 'billingTerms', 'billingStatus').partial()
					.fields,
				billingPlanId: v.optional(v.string())
			})
		)
	});
	const t = convexTest(legacySchema, modules);
	const {
		nightlyPrice: _nightlyPrice,
		discountPercent: _discount,
		weekendPrice: _weekend,
		billingPlanId: _plan,
		...details
	} = listing;
	const base = {
		...details,
		ownerId: 'seed-owner',
		billingPeriodEndsAt: null,
		pricePerNightMinor: 8025,
		discountBps: 0,
		weekendPricePerNightMinor: null,
		effectivePricePerNightMinor: 8025,
		recommendationSortKey: -3,
		guestRatingAverage: 0,
		guestReviewCount: 0,
		updatedAt: 1
	};
	const ids = await t.run(async (ctx) => {
		const ids = [];
		for (const status of ['published', 'unpublished', 'deleted'] as const)
			ids.push(await ctx.db.insert('accommodations', { ...base, status }));
		ids.push(
			await ctx.db.insert('accommodations', {
				...base,
				status: 'unpublished',
				billingPlanId: 'previous-flat-fee-plan',
				billingTerms: ACCOMMODATION_BILLING_PLANS.flat_fee,
				billingStatus: 'pending_payment'
			})
		);
		ids.push(
			await ctx.db.insert('accommodations', {
				...base,
				status: 'published',
				billingPlanId: 'booking_fee',
				billingTerms: { model: 'booking_fee', commissionBps: 1250 },
				billingStatus: 'active'
			})
		);
		return ids;
	});
	const before = await t.run((ctx) =>
		Promise.all(ids.map((id) => ctx.db.get('accommodations', id)))
	);
	const migration = internal.migrations.backfillAccommodationBilling.backfillAccommodationBilling;
	const args = { cursor: null, batchSize: 2, oneBatchOnly: true, dryRun: false };
	for (let run = 0; run < 2; run++) {
		let page = await t.mutation(migration, args);
		while (!page.isDone) {
			expect(page.processed).toBeLessThanOrEqual(2);
			page = await t.mutation(migration, { ...args, cursor: page.continueCursor });
		}
	}

	const after = await t.run((ctx) =>
		Promise.all(ids.map((id) => ctx.db.get('accommodations', id)))
	);
	for (let i = 0; i < 3; i++)
		expect(after[i]).toEqual({
			...before[i],
			billingPlanId: 'booking_fee',
			billingTerms: ACCOMMODATION_BILLING_PLANS.booking_fee,
			billingStatus: 'active'
		});
	expect(after[3]).toEqual({ ...before[3], billingPlanId: 'flat_fee' });
	expect(after[4]).toEqual(before[4]);
	const required = convexTest(schema, modules);
	await required.run(async (ctx) => {
		for (const row of after) {
			if (
				!row ||
				row.billingTerms === undefined ||
				row.billingStatus === undefined ||
				row.billingPlanId !== row.billingTerms.model
			)
				throw new Error('Backfilled billing fields are missing');
			const { _id, _creationTime, ...data } = row;
			await ctx.db.insert('accommodations', {
				...data,
				billingPlanId: row.billingTerms.model,
				billingTerms: row.billingTerms,
				billingStatus: row.billingStatus
			});
		}
	});
	for (const field of ['billingPlanId', 'billingTerms', 'billingStatus'] as const) {
		const data = { ...base, ...bookingFeeBilling, status: 'published' as const };
		Reflect.deleteProperty(data, field);
		await expect(required.run((ctx) => ctx.db.insert('accommodations', data))).rejects.toThrow();
	}
	const partial = await t.run((ctx) =>
		ctx.db.insert('accommodations', {
			...base,
			status: 'published',
			billingPlanId: 'booking_fee'
		})
	);
	await expect(
		t.mutation(migration, { cursor: null, batchSize: 50, oneBatchOnly: true, dryRun: false })
	).rejects.toThrow('Incomplete billing fields');
	expect(await t.run((ctx) => ctx.db.get('accommodations', partial))).not.toHaveProperty(
		'billingStatus'
	);
});

test('single-day cleanup preserves arrival-today choices and frozen fees across pages and reruns', async () => {
	const legacySchema = defineSchema({
		...tables,
		accommodations: defineTable(
			accommodations.validator.omit('sameDayReservation').extend({
				singleDayReservation: v.optional(v.boolean()),
				sameDayReservation: v.optional(v.boolean()),
				dayUseStart: v.optional(v.union(v.string(), v.null())),
				dayUseEnd: v.optional(v.union(v.string(), v.null())),
				pricePerDayUseMinor: v.optional(v.union(v.number(), v.null()))
			})
		),
		bookings: defineTable(
			bookings.validator.omit('cancellationTerms').extend({
				cancellationTerms: termsValidator.omit('stayType', 'pricePerDayUseMinor').extend({
					stayType: v.optional(termsValidator.fields.stayType),
					pricePerDayUseMinor: v.optional(termsValidator.fields.pricePerDayUseMinor)
				})
			})
		)
	});
	const t = convexTest(legacySchema, modules);
	const {
		nightlyPrice,
		discountPercent: _discount,
		weekendPrice: _weekend,
		sameDayReservation: _same,
		...details
	} = listing;
	const base = {
		...details,
		ownerId: 'host',
		recommendationSortKey: -3,
		guestRatingAverage: 0,
		guestReviewCount: 0,
		pricePerNightMinor: nightlyPrice * 100,
		discountBps: 0,
		weekendPricePerNightMinor: null,
		effectivePricePerNightMinor: nightlyPrice * 100,
		status: 'published' as const,
		updatedAt: 1
	};
	const enabled = {
		singleDayReservation: true,
		sameDayReservation: true,
		dayUseStart: '10:00',
		dayUseEnd: '18:00',
		pricePerDayUseMinor: 4500
	};
	const ids = await t.run(async (ctx) => [
		await ctx.db.insert('accommodations', {
			...bookingFeeBilling,
			...base
		}),
		await ctx.db.insert('accommodations', {
			...bookingFeeBilling,
			...base,
			...enabled
		}),
		await ctx.db.insert('accommodations', {
			...bookingFeeBilling,
			...base,
			sameDayReservation: true
		})
	]);
	const frozen = bookingCancellationTerms('2027-07-16', '2027-07-17');
	const { stayType: _stay, pricePerDayUseMinor: _fee, ...legacyTerms } = frozen;
	const dayUseTerms = { ...frozen, stayType: 'day_use' as const, pricePerDayUseMinor: 4500 };
	const bookingIds = await t.run(async (ctx) => {
		const booking = {
			accommodationId: ids[0],
			status: 'pending' as const,
			firstName: 'Guest',
			lastName: 'Test',
			email: 'guest@example.com',
			phone: '123',
			checkInDate: '2027-07-16',
			checkOutDate: '2027-07-17',
			adults: 1,
			children: 0
		};
		return [
			await ctx.db.insert('bookings', {
				platformFeeTerms: null,
				paymentMethod: 'cash',
				...booking,
				cancellationTerms: legacyTerms
			}),
			await ctx.db.insert('bookings', {
				platformFeeTerms: null,
				paymentMethod: 'cash',
				...booking,
				checkOutDate: booking.checkInDate,
				cancellationTerms: dayUseTerms
			})
		];
	});
	const args = { cursor: null, batchSize: 1, dryRun: false, oneBatchOnly: true };
	for (const migration of [
		internal.migrations.backfillReservationRules.backfillAccommodationReservationRules,
		internal.migrations.backfillReservationRules.backfillBookingReservationTerms,
		internal.migrations.removeSingleDayReservations.removeSingleDayReservations
	]) {
		for (let run = 0; run < 2; run++) {
			let page = await t.mutation(migration, args);
			while (!page.isDone) {
				page = await t.mutation(migration, { ...args, cursor: page.continueCursor });
				expect(page.processed).toBeLessThanOrEqual(1);
			}
		}
	}
	const saved = await t.run(async (ctx) =>
		Promise.all(ids.map((id) => ctx.db.get('accommodations', id)))
	);
	expect(saved[0]).toMatchObject({ sameDayReservation: false, updatedAt: 1 });
	expect(saved[1]).toMatchObject({ sameDayReservation: true, updatedAt: 1 });
	expect(saved[2]).toMatchObject({ sameDayReservation: true });
	for (const listing of saved) {
		for (const key of ['singleDayReservation', 'dayUseStart', 'dayUseEnd', 'pricePerDayUseMinor'])
			expect(listing).not.toHaveProperty(key);
	}
	const savedBookings = await t.run(async (ctx) =>
		Promise.all(bookingIds.map((id) => ctx.db.get('bookings', id)))
	);
	expect(savedBookings[0]?.cancellationTerms).toEqual(frozen);
	expect(savedBookings[1]?.cancellationTerms).toEqual(dayUseTerms);
	const invalidId = await t.run((ctx) =>
		ctx.db
			.patch('bookings', bookingIds[1], { cancellationTerms: legacyTerms })
			.then(() => bookingIds[1])
	);
	await expect(
		t.mutation(internal.migrations.backfillReservationRules.backfillBookingReservationTerms, {
			...args,
			batchSize: 100
		})
	).rejects.toThrow(`Resolve missing frozen day-use fee for booking ${invalidId}`);
});

test('hosts create and update arrival-today settings without single-day options', async () => {
	const t = setup();
	const owner = t.withIdentity({ subject: 'host', tokenIdentifier: 'issuer|host' });
	const create = api.tables.accommodations.mutations.createAccommodation.createAccommodation;
	const update = api.tables.accommodations.mutations.updateAccommodation.updateAccommodation;
	await t.run(async (ctx) => {
		for (const key of imageKeys)
			await ctx.db.insert('storageUploads', {
				ownerId: 'host',
				key,
				status: 'uploaded',
				createdAt: Date.now()
			});
	});
	const id = await owner.mutation(create, {
		...listing,
		uploadedFiles: imageKeys,
		sameDayReservation: true
	});
	await owner.mutation(update, { id, sameDayReservation: false });
	expect(await t.run((ctx) => ctx.db.get('accommodations', id))).toMatchObject({
		sameDayReservation: false
	});
	const retiredSetting = { id, singleDayReservation: true };
	await expect(owner.mutation(update, retiredSetting)).rejects.toThrow();
});

test('backfilled listings can update unrelated fields', async () => {
	const t = setup();
	const owner = t.withIdentity({ subject: 'host', tokenIdentifier: 'issuer|host' });
	const {
		nightlyPrice,
		discountPercent: _discount,
		weekendPrice: _weekend,
		sameDayReservation: _sameDayReservation,
		...details
	} = listing;
	const id = await t.run((ctx) =>
		ctx.db.insert('accommodations', {
			...bookingFeeBilling,
			...details,
			ownerId: 'host',
			sameDayReservation: false,
			recommendationSortKey: -3,
			guestRatingAverage: 0,
			guestReviewCount: 0,
			pricePerNightMinor: Math.round(nightlyPrice * 100),
			discountBps: 0,
			weekendPricePerNightMinor: null,
			effectivePricePerNightMinor: Math.round(nightlyPrice * 100),
			status: 'published',
			updatedAt: 1
		})
	);
	const legacy = await t.run((ctx) => ctx.db.get('accommodations', id));
	expect(legacy?.sameDayReservation).toBe(false);
	await t.run(async (ctx) => {
		const doc = await ctx.db.get('accommodations', id);
		if (doc) await accommodationOwnerAggregate.insert(ctx, doc);
	});
	await owner.mutation(
		api.tables.accommodations.mutations.updateAccommodation.updateAccommodation,
		{
			id,
			name: 'Updated legacy apartment'
		}
	);
	expect(await t.run((ctx) => ctx.db.get('accommodations', id))).toMatchObject({
		name: 'Updated legacy apartment',
		sameDayReservation: false
	});
});

test.each(['request', 'instant', undefined] as const)(
	'hosts save and change booking mode while legacy creation defaults safely (%s)',
	async (bookingMode) => {
		const t = setup();
		const owner = t.withIdentity({ subject: 'host', tokenIdentifier: 'issuer|host' });
		const stranger = t.withIdentity({ subject: 'stranger', tokenIdentifier: 'issuer|stranger' });
		const create = api.tables.accommodations.mutations.createAccommodation.createAccommodation;
		const update = api.tables.accommodations.mutations.updateAccommodation.updateAccommodation;
		await t.run(async (ctx) => {
			for (const key of imageKeys)
				await ctx.db.insert('storageUploads', {
					ownerId: 'host',
					key,
					status: 'uploaded',
					createdAt: Date.now()
				});
		});
		const id = await owner.mutation(create, { ...listing, bookingMode, uploadedFiles: imageKeys });
		expect((await t.run((ctx) => ctx.db.get('accommodations', id)))?.bookingMode).toBe(
			bookingMode ?? 'request'
		);
		await expect(stranger.mutation(update, { id, bookingMode: 'instant' })).rejects.toMatchObject({
			data: { code: 'FORBIDDEN' }
		});
		const nextMode = bookingMode === 'instant' ? 'request' : 'instant';
		await owner.mutation(update, { id, bookingMode: nextMode });
		await owner.mutation(update, { id, name: 'Updated listing name' });
		expect((await t.run((ctx) => ctx.db.get('accommodations', id)))?.bookingMode).toBe(nextMode);
		expect(
			(
				await t.query(
					api.tables.accommodations.queries.fetchPublicAccommodation.fetchPublicAccommodation,
					{ id }
				)
			)?.bookingMode
		).toBe(nextMode);
		expect(saveAccommodationSchema.safeParse({ ...listing, bookingMode: 'unknown' }).success).toBe(
			false
		);
	}
);

test('policy migration fills missing policies in bounded pages and preserves existing terms on reruns', async () => {
	const legacySchema = defineSchema({
		...tables,
		accommodations: defineTable(
			accommodations.validator.omit('cancellationPolicy').extend({
				cancellationPolicy: v.optional(accommodations.validator.fields.cancellationPolicy)
			})
		)
	});
	const t = convexTest(legacySchema, modules);
	const { nightlyPrice, discountPercent: _discount, weekendPrice: _weekend, ...details } = listing;
	const base = {
		...details,
		cancellationPolicy: undefined,
		ownerId: 'host',
		sameDayReservation: false,
		recommendationSortKey: -3,
		guestRatingAverage: 0,
		guestReviewCount: 0,
		pricePerNightMinor: Math.round(nightlyPrice * 100),
		discountBps: 0,
		weekendPricePerNightMinor: null,
		effectivePricePerNightMinor: Math.round(nightlyPrice * 100),
		status: 'published' as const,
		updatedAt: 1
	};
	const custom = {
		version: 1,
		mode: 'custom',
		fiveToSevenDays: 100,
		threeToFiveDays: 50,
		oneToThreeDays: 50,
		under24Hours: 0
	} as const;
	const ids = await t.run(async (ctx) => [
		await ctx.db.insert('accommodations', {
			...bookingFeeBilling,
			...base
		}),
		await ctx.db.insert('accommodations', {
			...bookingFeeBilling,
			...base,
			cancellationPolicy: custom
		}),
		await ctx.db.insert('accommodations', {
			...bookingFeeBilling,
			...base
		})
	]);
	const migration =
		internal.migrations.backfillAccommodationCancellationPolicies
			.backfillAccommodationCancellationPolicies;
	const args = { cursor: null, batchSize: 1, dryRun: false, oneBatchOnly: true };
	for (let run = 0; run < 2; run++) {
		let page = await t.mutation(migration, args);
		let processed = page.processed;
		while (!page.isDone) {
			page = await t.mutation(migration, { ...args, cursor: page.continueCursor });
			expect(page.processed).toBeLessThanOrEqual(1);
			processed += page.processed;
		}
		expect(processed).toBe(3);
	}
	const saved = await t.run(async (ctx) =>
		Promise.all(ids.map((id) => ctx.db.get('accommodations', id)))
	);
	expect(saved.map((doc) => doc?.cancellationPolicy)).toEqual([
		ACCOMMODATION_CONFIG.CANCELLATION_DEFAULT_POLICY,
		custom,
		ACCOMMODATION_CONFIG.CANCELLATION_DEFAULT_POLICY
	]);
	expect(saved.every((doc) => doc?.updatedAt === 1)).toBe(true);
});

function setup() {
	const t = convexTest(schema, modules);
	r2Test.register(t);
	actionRetrierTest.register(t, 'r2/actionRetrier');
	rateLimiterTest.register(t);
	aggregateTest.register(t, 'accommodationOwnerAggregate');
	aggregateTest.register(t, 'reviewsAggregate');
	return t;
}

test('list rows and map pins apply the same discounted stay filters through paginated geographic searches', async () => {
	const t = setup();
	const listQuery =
		api.tables.accommodations.queries.fetchAccommodationsSearch.fetchAccommodationsSearch;
	const mapQuery =
		api.tables.accommodations.queries.fetchAccommodationsMapSearch.fetchAccommodationsMap;
	const {
		nightlyPrice: _nightlyPrice,
		discountPercent: _discount,
		weekendPrice: _weekend,
		...details
	} = listing;
	const base = {
		...details,
		cancellationPolicy: ACCOMMODATION_CONFIG.CANCELLATION_DEFAULT_POLICY,
		ownerId: 'filter-test',
		sameDayReservation: false,
		recommendationSortKey: -3,
		guestRatingAverage: 0,
		guestReviewCount: 0,
		pricePerNightMinor: 10000,
		discountBps: 1975,
		weekendPricePerNightMinor: null,
		effectivePricePerNightMinor: 8025,
		maxGuests: 6,
		bedrooms: 2,
		beds: 3,
		bathrooms: 2,
		amenities: [...AMENITY_KEYS],
		status: 'published' as const,
		updatedAt: 1
	};
	const variants = [
		{ ...base, amenities: [] },
		base,
		{
			...base,
			pricePerNightMinor: 10050,
			discountBps: 0,
			weekendPricePerNightMinor: null,
			effectivePricePerNightMinor: 10050,
			bedrooms: 4
		},
		{
			...base,
			pricePerNightMinor: 8024,
			discountBps: 0,
			weekendPricePerNightMinor: null,
			effectivePricePerNightMinor: 8024
		},
		{
			...base,
			pricePerNightMinor: 10051,
			discountBps: 0,
			weekendPricePerNightMinor: null,
			effectivePricePerNightMinor: 10051
		},
		{ ...base, type: 'studio' as const },
		{ ...base, bedrooms: 1 },
		{ ...base, beds: 2 },
		{ ...base, bathrooms: 1 },
		{ ...base, maxGuests: 4 },
		{ ...base, amenities: ['wifi', 'heating'] },
		{ ...base, longitude: 21 },
		{ ...base, latitude: 45 },
		{ ...base, address: { ...base.address, city: 'Novi Sad' } }
	];
	const ids = await t.run(async (ctx) => {
		const inserted = [];
		for (const row of variants)
			inserted.push(
				await ctx.db.insert('accommodations', {
					...bookingFeeBilling,
					...row
				})
			);
		return inserted;
	});
	const stayFilters: AccommodationSearchFilters = {
		minPrice: 80.25,
		maxPrice: 100.5,
		type: 'apartment',
		bedrooms: 2,
		beds: 3,
		bathrooms: 2,
		amenities: ['wifi', 'elevator', 'heating']
	};
	const bounds = { south: 44.8, north: 44.9, west: 20.4, east: 20.5 };
	const cases: Array<
		Omit<FunctionArgs<typeof mapQuery>, 'paginationOpts'> & { expected: string[] }
	> = [
		{
			location: { country: 'Serbia', city: 'Belgrade' },
			stayFilters,
			adults: 3,
			children: 2,
			expected: [ids[1], ids[2], ids[11], ids[12]]
		},
		{ location: {}, bounds, stayFilters, adults: 5, expected: [ids[1], ids[2], ids[13]] },
		{ location: {}, bounds, stayFilters, rooms: 4, adults: 5, expected: [ids[2]] },
		{
			location: {},
			bounds,
			stayFilters: { ...stayFilters, minPrice: 100.51, maxPrice: 0 },
			adults: 5,
			expected: [ids[4]]
		},
		{
			location: {},
			bounds,
			stayFilters: { amenities: ['wifi'] },
			expected: ids.filter((_id, index) => ![0, 11, 12].includes(index))
		},
		{
			location: {},
			bounds,
			stayFilters: {},
			expected: ids.filter((_id, index) => ![11, 12].includes(index))
		},
		{ location: {}, bounds: { ...bounds, west: 20.6, east: 20.7 }, stayFilters, expected: [] }
	];
	for (const query of [listQuery, mapQuery]) {
		const first = await t.query(query, {
			location: { country: 'Serbia', city: 'Belgrade' },
			stayFilters: { amenities: ['wifi'], minPrice: 80.25 },
			paginationOpts: { cursor: null, numItems: 1, maximumRowsRead: 1 }
		});
		expect(first.items).toEqual([]);
		expect(first.nextCursor).not.toBeNull();
		for (const { expected, ...criteria } of cases) {
			let cursor: string | null = null;
			const matchingIds: string[] = [];
			do {
				const page: FunctionReturnType<typeof query> = await t.query(query, {
					...criteria,
					paginationOpts: { cursor, numItems: 2, maximumRowsRead: 3 }
				});
				matchingIds.push(...page.items.map((item) => item._id));
				cursor = page.nextCursor;
			} while (cursor !== null);
			expect(matchingIds.sort()).toEqual([...expected].sort());
		}
		for (const invalid of [
			{ beds: -1 },
			{ bathrooms: 1.5 },
			{ minPrice: 81, maxPrice: 80 },
			{ minPrice: Number.NaN }
		]) {
			await expect(
				t.query(query, {
					location: {},
					bounds,
					stayFilters: invalid,
					paginationOpts: { cursor: null, numItems: 2 }
				})
			).rejects.toThrow();
		}
	}
});

test('recommendation, price and guest rating order filtered results before cursor pagination', async () => {
	const t = setup();
	const query =
		api.tables.accommodations.queries.fetchAccommodationsSearch.fetchAccommodationsSearch;
	const {
		nightlyPrice: _price,
		discountPercent: _discount,
		weekendPrice: _weekend,
		...details
	} = listing;
	const base = {
		...details,
		cancellationPolicy: ACCOMMODATION_CONFIG.CANCELLATION_DEFAULT_POLICY,
		imageKeys: [],
		ownerId: 'sorting-test',
		pricePerNightMinor: 9000,
		discountBps: 0,
		weekendPricePerNightMinor: null,
		effectivePricePerNightMinor: 9000,
		sameDayReservation: false,
		recommendationSortKey: -4.5,
		guestRatingAverage: 0,
		guestReviewCount: 0,
		bedrooms: 3,
		amenities: ['wifi'],
		status: 'published' as const,
		updatedAt: 1
	};
	const rows = [
		base,
		{
			...base,
			pricePerNightMinor: 2000,
			discountBps: 0,
			weekendPricePerNightMinor: null,
			effectivePricePerNightMinor: 2000,
			recommendationSortKey: -3,
			guestRatingAverage: 0,
			guestReviewCount: 0,
			address: { ...base.address, city: 'Novi Sad' }
		},
		{
			...base,
			pricePerNightMinor: 8000,
			discountBps: 5000,
			weekendPricePerNightMinor: null,
			effectivePricePerNightMinor: 4000
		},
		{
			...base,
			pricePerNightMinor: 1000,
			discountBps: 0,
			weekendPricePerNightMinor: null,
			effectivePricePerNightMinor: 1000,
			recommendationSortKey: -5,
			bedrooms: 2
		},
		{
			...base,
			pricePerNightMinor: 3000,
			discountBps: 0,
			weekendPricePerNightMinor: null,
			effectivePricePerNightMinor: 3000,
			recommendationSortKey: -4,
			guestRatingAverage: 0,
			guestReviewCount: 0,
			address: { ...base.address, country: 'Croatia', city: 'Zagreb' }
		},
		{
			...base,
			pricePerNightMinor: 30000,
			discountBps: 0,
			weekendPricePerNightMinor: null,
			effectivePricePerNightMinor: 30000,
			recommendationSortKey: -5,
			latitude: 45
		},
		{
			...base,
			pricePerNightMinor: 500,
			discountBps: 0,
			weekendPricePerNightMinor: null,
			effectivePricePerNightMinor: 500,
			recommendationSortKey: -5,
			amenities: []
		},
		{
			...base,
			pricePerNightMinor: 5000,
			discountBps: 0,
			weekendPricePerNightMinor: null,
			effectivePricePerNightMinor: 5000,
			recommendationSortKey: -4
		}
	];
	const ids = await t.run(async (ctx) => {
		const inserted = [];
		const ratings = [
			[4.8, 20],
			[0, 2],
			[4.8, 50],
			[5, 500],
			[4.9, 5],
			[5, 3],
			[5, 500],
			[0, 0]
		];
		for (const [index, row] of rows.entries()) {
			inserted.push(
				await ctx.db.insert('accommodations', {
					...bookingFeeBilling,
					...row,
					guestRatingAverage: ratings[index][0],
					guestReviewCount: ratings[index][1]
				})
			);
		}
		return inserted;
	});
	const scopes = [
		{
			criteria: { location: { country: 'Serbia' } },
			recommended: [5, 2, 0, 7, 1],
			guestRating: [5, 2, 0, 1, 7],
			ascending: [1, 2, 7, 0, 5]
		},
		{
			criteria: { location: { country: 'Serbia', city: 'Belgrade' } },
			recommended: [5, 2, 0, 7],
			guestRating: [5, 2, 0, 7],
			ascending: [2, 7, 0, 5]
		},
		{
			criteria: {
				location: { country: 'Serbia', city: 'Belgrade' },
				bounds: { south: 44.8, north: 44.9, west: 20.4, east: 20.5 }
			},
			recommended: [2, 0, 4, 7, 1],
			guestRating: [4, 2, 0, 1, 7],
			ascending: [1, 4, 2, 7, 0]
		}
	];
	for (const { criteria, recommended, ascending, guestRating } of scopes) {
		for (const sort of ['recommended', 'price-asc', 'price-desc', 'guest-rating'] as const) {
			let cursor: string | null = null;
			const received: string[] = [];
			do {
				const page: FunctionReturnType<typeof query> = await t.query(query, {
					...criteria,
					sort,
					stayFilters: { bedrooms: 3, amenities: ['wifi'] },
					paginationOpts: { cursor, numItems: 2, maximumRowsRead: 3 }
				});
				expect(
					page.items.every(
						(item) =>
							!('recommendationSortKey' in item) &&
							!('guestRatingAverage' in item) &&
							!('guestReviewCount' in item)
					)
				).toBe(true);
				received.push(...page.items.map((item) => item._id));
				cursor = page.nextCursor;
			} while (cursor !== null);
			const expected =
				sort === 'guest-rating'
					? guestRating
					: sort === 'recommended'
						? recommended
						: sort === 'price-asc'
							? ascending
							: [...ascending].reverse();
			expect(received).toEqual(expected.map((index) => ids[index]));
		}
	}
	const defaultPage = await t.query(query, {
		location: { country: 'Serbia' },
		stayFilters: { bedrooms: 3, amenities: ['wifi'] },
		paginationOpts: { cursor: null, numItems: 10 }
	});
	expect(defaultPage.items.map((item) => item._id)).toEqual(
		[5, 2, 0, 7, 1].map((index) => ids[index])
	);
});

test('recommendation backfill refreshes existing scores and can be safely rerun', async () => {
	const t = setup();
	const {
		nightlyPrice: _price,
		discountPercent: _discount,
		weekendPrice: _weekend,
		...details
	} = listing;
	const id = await t.run((ctx) =>
		ctx.db.insert('accommodations', {
			...bookingFeeBilling,
			...details,
			cancellationPolicy: ACCOMMODATION_CONFIG.CANCELLATION_DEFAULT_POLICY,
			imageKeys: [],
			ownerId: 'backfill-test',
			sameDayReservation: false,
			recommendationSortKey: -1,
			guestRatingAverage: 0,
			guestReviewCount: 0,
			pricePerNightMinor: 8025,
			discountBps: 0,
			weekendPricePerNightMinor: null,
			effectivePricePerNightMinor: 8025,
			status: 'published',
			updatedAt: 1
		})
	);
	const migration =
		internal.migrations.backfillAccommodationRecommendationScores
			.backfillAccommodationRecommendationScores;
	const args = { cursor: null, batchSize: 2, dryRun: false, oneBatchOnly: true };
	await t.mutation(migration, args);
	expect((await t.run((ctx) => ctx.db.get('accommodations', id)))?.recommendationSortKey).toBe(-3);
	await t.mutation(migration, args);
	expect((await t.run((ctx) => ctx.db.get('accommodations', id)))?.recommendationSortKey).toBe(-3);
});

test('dense map fixtures use distinct batches and clean only their owner in bounded steps', async () => {
	const t = setup();
	const ownerId = 'search-map-benchmark-test';
	await t.mutation(internal.seed.seedAccommodations, {
		ownerId,
		count: 100,
		denseBelgrade: true,
		offset: 0
	});
	await t.mutation(internal.seed.seedAccommodations, {
		ownerId,
		count: 1,
		denseBelgrade: true,
		offset: 100
	});
	const fixtures = await t.run((ctx) =>
		ctx.db
			.query('accommodations')
			.withIndex('by_owner_id', (q) => q.eq('ownerId', ownerId))
			.take(102)
	);
	expect(fixtures).toHaveLength(101);
	expect(
		fixtures.every((row) => row.address.city === 'Belgrade' && row.address.country === 'Serbia')
	).toBe(true);
	expect(
		fixtures.every(
			(row) =>
				row.latitude > 44.77 &&
				row.latitude < 44.86 &&
				row.longitude > 20.4 &&
				row.longitude < 20.53
		)
	).toBe(true);
	expect(new Set(fixtures.map((row) => row.imageKeys[0])).size).toBe(101);
	expect(new Set(fixtures.map((row) => row.maxGuests)).size).toBeGreaterThan(1);
	expect(new Set(fixtures.map((row) => row.bedrooms)).size).toBeGreaterThan(1);
	const mapQuery =
		api.tables.accommodations.queries.fetchAccommodationsMapSearch.fetchAccommodationsMap;
	const criteria = {
		location: {},
		bounds: { south: 44.77, north: 44.86, west: 20.4, east: 20.53 },
		adults: 6,
		rooms: 3
	};
	let cursor: string | null = null;
	const ids: string[] = [];
	do {
		const page: FunctionReturnType<typeof mapQuery> = await t.query(mapQuery, {
			...criteria,
			paginationOpts: { cursor, numItems: 10 }
		});
		ids.push(...page.items.map((item) => item._id));
		cursor = page.nextCursor;
	} while (cursor !== null);
	expect(ids.sort()).toEqual(
		fixtures
			.filter((row) => row.maxGuests >= 6 && row.bedrooms >= 3)
			.map((row) => row._id)
			.sort()
	);
	await t.mutation(internal.seed.seedAccommodations, { ownerId: 'other-owner', count: 1 });
	expect(await t.mutation(internal.seed.clearSeededAccommodations, { ownerId })).toBe(100);
	expect(await t.mutation(internal.seed.clearSeededAccommodations, { ownerId })).toBe(1);
	expect(await t.mutation(internal.seed.clearSeededAccommodations, { ownerId })).toBe(0);
	expect(await t.run((ctx) => accommodationOwnerAggregate.count(ctx, { namespace: ownerId }))).toBe(
		0
	);
	expect(await t.run((ctx) => ctx.db.query('accommodations').take(2))).toHaveLength(1);
}, 30_000);

test('public details resolve ordered photos without exposing owner or storage keys', async () => {
	const t = setup();
	const { nightlyPrice, discountPercent: _discount, weekendPrice: _weekend, ...details } = listing;
	const id = await t.run((ctx) =>
		ctx.db.insert('accommodations', {
			...bookingFeeBilling,
			...details,
			cancellationPolicy: ACCOMMODATION_CONFIG.CANCELLATION_DEFAULT_POLICY,
			ownerId: 'private-owner',
			sameDayReservation: false,
			recommendationSortKey: -3,
			guestRatingAverage: 0,
			guestReviewCount: 0,
			pricePerNightMinor: Math.round(nightlyPrice * 100),
			discountBps: 0,
			weekendPricePerNightMinor: null,
			effectivePricePerNightMinor: Math.round(nightlyPrice * 100),
			status: 'published',
			updatedAt: 1
		})
	);
	const result = await t.query(
		api.tables.accommodations.queries.fetchPublicAccommodation.fetchPublicAccommodation,
		{ id }
	);
	expect(result).toMatchObject({ name: listing.name, pricePerNightMinor: 8025 });
	expect(result?.imageUrls).toEqual(imageKeys.map((key) => `https://cdn.example.com/${key}`));
	expect(result).not.toHaveProperty('ownerId');
	expect(result).not.toHaveProperty('imageKeys');
	await t.run((ctx) => ctx.db.delete(id));
	expect(
		await t.query(
			api.tables.accommodations.queries.fetchPublicAccommodation.fetchPublicAccommodation,
			{ id }
		)
	).toBeNull();
	// SAFETY: Deliberately malformed input verifies Convex's runtime ID validator.
	await expect(
		t.query(api.tables.accommodations.queries.fetchPublicAccommodation.fetchPublicAccommodation, {
			id: 'invalid' as typeof id
		})
	).rejects.toThrow();
});

test('owner listing resolves ordered photos and rejects other identities', async () => {
	const t = setup();
	const owner = t.withIdentity({ subject: 'host', tokenIdentifier: 'issuer|host' });
	const stranger = t.withIdentity({ subject: 'stranger', tokenIdentifier: 'issuer|stranger' });
	const { nightlyPrice, discountPercent: _discount, weekendPrice: _weekend, ...details } = listing;
	const id = await t.run((ctx) =>
		ctx.db.insert('accommodations', {
			...bookingFeeBilling,
			...details,
			cancellationPolicy: ACCOMMODATION_CONFIG.CANCELLATION_DEFAULT_POLICY,
			ownerId: 'host',
			sameDayReservation: false,
			recommendationSortKey: -3,
			guestRatingAverage: 0,
			guestReviewCount: 0,
			pricePerNightMinor: Math.round(nightlyPrice * 100),
			discountBps: 0,
			weekendPricePerNightMinor: null,
			effectivePricePerNightMinor: Math.round(nightlyPrice * 100),
			status: 'published',
			updatedAt: 1
		})
	);

	const fetchListing =
		api.tables.accommodations.queries.fetchMyAccommodationListing.fetchMyAccommodationListing;
	const result = await owner.query(fetchListing, { id });
	expect(result).toMatchObject({ name: listing.name, pricePerNightMinor: 8025 });
	expect(result?.imageUrls).toEqual(imageKeys.map((key) => `https://cdn.example.com/${key}`));
	expect(result).not.toHaveProperty('ownerId');
	expect(await stranger.query(fetchListing, { id })).toBeNull();
	await expect(t.query(fetchListing, { id })).rejects.toMatchObject({
		data: { code: 'UNAUTHENTICATED' }
	});

	const fetchHeader = api.tables.accommodations.queries.fetchMyAccommodation.fetchMyAccommodation;
	expect(await owner.query(fetchHeader, { id })).toEqual({
		billingPlanId: 'booking_fee',
		billingPeriodEndsAt: null,
		_id: id,
		name: listing.name,
		timeZone: listing.timeZone,
		status: 'published',
		billingStatus: 'active',
		address: { city: 'Belgrade', country: 'Serbia' }
	});
	expect(await stranger.query(fetchHeader, { id })).toBeNull();
	await expect(t.query(fetchHeader, { id })).rejects.toMatchObject({
		data: { code: 'UNAUTHENTICATED' }
	});

	await t.run((ctx) => ctx.db.delete(id));
	expect(await owner.query(fetchListing, { id })).toBeNull();
	expect(await owner.query(fetchHeader, { id })).toBeNull();
});

test('owner updates one listing section, verifies photos, and refreshes the aggregate', async () => {
	const t = setup();
	const owner = t.withIdentity({ subject: 'host', tokenIdentifier: 'issuer|host' });
	const stranger = t.withIdentity({ subject: 'stranger', tokenIdentifier: 'issuer|stranger' });
	const { nightlyPrice, discountPercent: _discount, weekendPrice: _weekend, ...details } = listing;
	const id = await t.run(async (ctx) => {
		const docId = await ctx.db.insert('accommodations', {
			...bookingFeeBilling,
			...details,
			cancellationPolicy: ACCOMMODATION_CONFIG.CANCELLATION_DEFAULT_POLICY,
			ownerId: 'host',
			sameDayReservation: false,
			recommendationSortKey: -3,
			guestRatingAverage: 0,
			guestReviewCount: 0,
			pricePerNightMinor: Math.round(nightlyPrice * 100),
			discountBps: 0,
			weekendPricePerNightMinor: null,
			effectivePricePerNightMinor: Math.round(nightlyPrice * 100),
			status: 'published',
			updatedAt: 1
		});
		const doc = await ctx.db.get(docId);
		if (doc) await accommodationOwnerAggregate.insert(ctx, doc);
		return docId;
	});

	const update = api.tables.accommodations.mutations.updateAccommodation.updateAccommodation;

	await expect(stranger.mutation(update, { id, type: 'studio' })).rejects.toMatchObject({
		data: { code: 'FORBIDDEN' }
	});
	await expect(owner.mutation(update, { id, maxGuests: 0 })).rejects.toMatchObject({
		data: { code: 'INVALID_ACCOMMODATION' }
	});
	await expect(owner.mutation(update, { id, timeZone: 'Not/AZone' })).rejects.toMatchObject({
		data: { code: 'INVALID_ACCOMMODATION' }
	});

	await owner.mutation(update, { id, type: 'studio', maxGuests: 3 });
	await owner.mutation(update, {
		id,
		nightlyPrice: 99.5,
		weekendPrice: 120,
		discountPercent: 15,
		minimumStay: 3
	});

	const updated = await t.run((ctx) => ctx.db.get(id));
	expect(updated).toMatchObject({
		type: 'studio',
		maxGuests: 3,
		pricePerNightMinor: 9950,
		discountBps: 1500,
		weekendPricePerNightMinor: 12000,
		effectivePricePerNightMinor: 8458,
		minimumStay: 3,
		ownerId: 'host'
	});
	expect(updated?.updatedAt).toBeGreaterThan(1);
	expect(updated?.timeZone).toBe('Europe/Belgrade');
	await expect(
		t.run((ctx) => ctx.db.patch('accommodations', id, { timeZone: undefined }))
	).rejects.toThrow('timeZone');
	await owner.mutation(update, {
		id,
		latitude: 47.4979,
		longitude: 19.0402,
		timeZone: 'Europe/Budapest'
	});
	expect((await t.run((ctx) => ctx.db.get('accommodations', id)))?.timeZone).toBe(
		'Europe/Budapest'
	);
	expect((await t.run((ctx) => ctx.db.get('accommodations', id)))?.weekendPricePerNightMinor).toBe(
		12000
	);
	await expect(owner.mutation(update, { id, nightlyPrice: 130 })).rejects.toMatchObject({
		data: { code: 'INVALID_ACCOMMODATION' }
	});
	await owner.mutation(update, { id, weekendPrice: null });
	expect(
		(await t.run((ctx) => ctx.db.get('accommodations', id)))?.weekendPricePerNightMinor
	).toBeNull();

	expect(
		await t.run((ctx) =>
			accommodationOwnerAggregate.count(ctx, { namespace: 'host', bounds: { prefix: ['studio'] } })
		)
	).toBe(1);

	const newKey = 'new-living-room';
	await t.run((ctx) =>
		ctx.db.insert('storageUploads', {
			ownerId: 'host',
			key: newKey,
			status: 'uploaded',
			createdAt: Date.now()
		})
	);
	await expect(
		owner.mutation(update, { id, imageKeys: [imageKeys[0], 'not-owned'], uploadedFiles: [newKey] })
	).rejects.toMatchObject({ data: { code: 'INVALID_RETAINED_IMAGE' } });
	await expect(
		owner.mutation(update, {
			id,
			imageKeys: [imageKeys[0], imageKeys[0]],
			uploadedFiles: [newKey]
		})
	).rejects.toMatchObject({ data: { code: 'DUPLICATE_RETAINED_IMAGE' } });

	await owner.mutation(update, { id, imageKeys: [...imageKeys, newKey], uploadedFiles: [newKey] });
	const photos = await t.run((ctx) => ctx.db.get(id));
	expect(photos?.imageKeys).toEqual([...imageKeys, newKey]);
	expect(await t.run((ctx) => ctx.db.query('storageUploads').take(10))).toEqual([]);
});

test('owner policy saves preserve other sections and stored full-refund defaults', async () => {
	const t = setup();
	const owner = t.withIdentity({ subject: 'host', tokenIdentifier: 'issuer|host' });
	const stranger = t.withIdentity({ subject: 'stranger', tokenIdentifier: 'issuer|stranger' });
	const { nightlyPrice, discountPercent: _discount, weekendPrice: _weekend, ...details } = listing;
	const id = await t.run(async (ctx) => {
		const id = await ctx.db.insert('accommodations', {
			...bookingFeeBilling,
			...details,
			cancellationPolicy: ACCOMMODATION_CONFIG.CANCELLATION_DEFAULT_POLICY,
			ownerId: 'host',
			sameDayReservation: false,
			recommendationSortKey: -3,
			guestRatingAverage: 0,
			guestReviewCount: 0,
			pricePerNightMinor: Math.round(nightlyPrice * 100),
			discountBps: 0,
			weekendPricePerNightMinor: null,
			effectivePricePerNightMinor: Math.round(nightlyPrice * 100),
			status: 'published',
			updatedAt: 1
		});
		const doc = await ctx.db.get('accommodations', id);
		if (doc) await accommodationOwnerAggregate.insert(ctx, doc);
		return id;
	});
	const query =
		api.tables.accommodations.queries.fetchMyAccommodationListing.fetchMyAccommodationListing;
	const update = api.tables.accommodations.mutations.updateAccommodation.updateAccommodation;
	expect((await owner.query(query, { id }))?.cancellationPolicy).toEqual(
		ACCOMMODATION_CONFIG.CANCELLATION_DEFAULT_POLICY
	);
	expect((await t.run((ctx) => ctx.db.get('accommodations', id)))?.cancellationPolicy).toEqual(
		ACCOMMODATION_CONFIG.CANCELLATION_DEFAULT_POLICY
	);
	const policy = {
		version: 1,
		mode: 'custom',
		fiveToSevenDays: 100,
		threeToFiveDays: 50,
		oneToThreeDays: 50,
		under24Hours: 0
	} as const;
	await expect(t.mutation(update, { id, cancellationPolicy: policy })).rejects.toMatchObject({
		data: { code: 'UNAUTHENTICATED' }
	});
	await expect(stranger.mutation(update, { id, cancellationPolicy: policy })).rejects.toMatchObject(
		{ data: { code: 'FORBIDDEN' } }
	);
	await expect(
		owner.mutation(update, { id, cancellationPolicy: { ...policy, under24Hours: 100 } })
	).rejects.toMatchObject({ data: { code: 'INVALID_CANCELLATION_POLICY' } });
	const afterFailure = await t.run((ctx) => ctx.db.get('accommodations', id));
	expect(afterFailure?.cancellationPolicy).toEqual(
		ACCOMMODATION_CONFIG.CANCELLATION_DEFAULT_POLICY
	);
	expect(afterFailure?.updatedAt).toBe(1);
	// SAFETY: Deliberately invalid input verifies the generated runtime literal validator.
	await expect(
		owner.mutation(update, { id, cancellationPolicy: { ...policy, under24Hours: 25 as 0 } })
	).rejects.toThrow();
	await owner.mutation(update, { id, cancellationPolicy: policy });
	expect((await owner.query(query, { id }))?.cancellationPolicy).toEqual(policy);
	await owner.mutation(update, { id, minimumStay: 2 });
	const saved = await t.run((ctx) => ctx.db.get('accommodations', id));
	expect(saved).toMatchObject({
		cancellationPolicy: policy,
		minimumStay: 2,
		name: listing.name,
		imageKeys,
		pricePerNightMinor: 8025
	});
	await owner.mutation(update, {
		id,
		cancellationPolicy: ACCOMMODATION_CONFIG.CANCELLATION_DEFAULT_POLICY
	});
	expect((await owner.query(query, { id }))?.cancellationPolicy).toEqual(
		ACCOMMODATION_CONFIG.CANCELLATION_DEFAULT_POLICY
	);
});

test('publishing creates one complete accommodation and claims ordered photos atomically', async () => {
	const t = setup();
	const owner = t.withIdentity({ subject: 'host', tokenIdentifier: 'issuer|host' });
	await t.run(async (ctx) => {
		for (const key of imageKeys)
			await ctx.db.insert('storageUploads', {
				ownerId: 'host',
				key,
				status: 'uploaded',
				createdAt: Date.now()
			});
	});
	expect(await t.run((ctx) => ctx.db.query('accommodations').take(1))).toEqual([]);
	const reordered = [...imageKeys].reverse();
	const id = await owner.mutation(
		api.tables.accommodations.mutations.createAccommodation.createAccommodation,
		{
			...listing,
			imageKeys: reordered,
			uploadedFiles: imageKeys
		}
	);
	const accommodation = await t.run((ctx) => ctx.db.get(id));
	expect(accommodation).toMatchObject({
		cancellationPolicy: ACCOMMODATION_CONFIG.CANCELLATION_DEFAULT_POLICY,
		ownerId: 'host',
		recommendationSortKey: -3,
		guestRatingAverage: 0,
		guestReviewCount: 0,
		status: 'published',
		imageKeys: reordered,
		pricePerNightMinor: 8025,
		discountBps: 0,
		weekendPricePerNightMinor: null,
		effectivePricePerNightMinor: 8025,
		latitude: listing.latitude,
		longitude: listing.longitude,
		address: listing.address
	});
	expect(await t.run((ctx) => ctx.db.query('accommodations').take(2))).toHaveLength(1);
	expect(await t.run((ctx) => ctx.db.query('storageUploads').take(10))).toEqual([]);
	expect(await t.run((ctx) => accommodationOwnerAggregate.count(ctx, { namespace: 'host' }))).toBe(
		1
	);
	await expect(
		owner.mutation(api.tables.accommodations.mutations.createAccommodation.createAccommodation, {
			...listing,
			uploadedFiles: imageKeys
		})
	).rejects.toMatchObject({ data: { code: 'UPLOAD_NOT_FOUND' } });
});

test('publishing persists the custom cancellation policy and owner reload returns the same terms', async () => {
	const t = setup();
	const owner = t.withIdentity({ subject: 'host', tokenIdentifier: 'issuer|host' });
	const cancellationPolicy = {
		version: 1,
		mode: 'custom',
		fiveToSevenDays: 100,
		threeToFiveDays: 50,
		oneToThreeDays: 50,
		under24Hours: 0
	} as const;
	await t.run(async (ctx) => {
		for (const key of imageKeys)
			await ctx.db.insert('storageUploads', {
				ownerId: 'host',
				key,
				status: 'uploaded',
				createdAt: Date.now()
			});
	});
	const id = await owner.mutation(
		api.tables.accommodations.mutations.createAccommodation.createAccommodation,
		{ ...listing, cancellationPolicy, uploadedFiles: imageKeys }
	);
	expect((await t.run((ctx) => ctx.db.get('accommodations', id)))?.cancellationPolicy).toEqual(
		cancellationPolicy
	);
	expect(
		(
			await owner.query(
				api.tables.accommodations.queries.fetchMyAccommodationListing.fetchMyAccommodationListing,
				{ id }
			)
		)?.cancellationPolicy
	).toEqual(cancellationPolicy);
});

test('failed publication writes nothing and preserves uploads for retry', async () => {
	const t = setup();
	const owner = t.withIdentity({ subject: 'host', tokenIdentifier: 'issuer|host' });
	const stranger = t.withIdentity({ subject: 'stranger', tokenIdentifier: 'issuer|stranger' });
	await t.run(async (ctx) => {
		for (const key of imageKeys)
			await ctx.db.insert('storageUploads', {
				ownerId: 'host',
				key,
				status: 'uploaded',
				createdAt: Date.now()
			});
	});
	await expect(
		t.mutation(api.tables.accommodations.mutations.createAccommodation.createAccommodation, listing)
	).rejects.toMatchObject({
		data: { code: 'UNAUTHENTICATED' }
	});
	await expect(
		stranger.mutation(api.tables.accommodations.mutations.createAccommodation.createAccommodation, {
			...listing,
			uploadedFiles: imageKeys
		})
	).rejects.toMatchObject({ data: { code: 'UPLOAD_NOT_FOUND' } });
	await expect(
		owner.mutation(api.tables.accommodations.mutations.createAccommodation.createAccommodation, {
			...listing,
			retainedFiles: imageKeys
		})
	).rejects.toMatchObject({ data: { code: 'INVALID_RETAINED_IMAGE' } });
	await expect(
		owner.mutation(api.tables.accommodations.mutations.createAccommodation.createAccommodation, {
			...listing,
			imageKeys: Array(5).fill(imageKeys[0]),
			uploadedFiles: imageKeys
		})
	).rejects.toMatchObject({ data: { code: 'DUPLICATE_RETAINED_IMAGE' } });
	await expect(
		owner.mutation(api.tables.accommodations.mutations.createAccommodation.createAccommodation, {
			...listing,
			uploadedFiles: imageKeys,
			nightlyPrice: 0
		})
	).rejects.toMatchObject({ data: { code: 'INVALID_ACCOMMODATION' } });
	await expect(
		owner.mutation(api.tables.accommodations.mutations.createAccommodation.createAccommodation, {
			...listing,
			uploadedFiles: imageKeys,
			checkInStart: '25:00'
		})
	).rejects.toMatchObject({ data: { code: 'INVALID_ACCOMMODATION' } });
	await expect(
		owner.mutation(api.tables.accommodations.mutations.createAccommodation.createAccommodation, {
			...listing,
			uploadedFiles: imageKeys,
			timeZone: 'Not/AZone'
		})
	).rejects.toMatchObject({ data: { code: 'INVALID_ACCOMMODATION' } });
	await expect(
		owner.mutation(api.tables.accommodations.mutations.createAccommodation.createAccommodation, {
			...listing,
			uploadedFiles: imageKeys,
			cancellationPolicy: {
				version: 1,
				mode: 'custom',
				fiveToSevenDays: 100,
				threeToFiveDays: 0,
				oneToThreeDays: 50,
				under24Hours: 0
			}
		})
	).rejects.toMatchObject({ data: { code: 'INVALID_ACCOMMODATION' } });
	expect(await t.run((ctx) => ctx.db.query('accommodations').take(1))).toEqual([]);
	expect(await t.run((ctx) => ctx.db.query('storageUploads').take(10))).toHaveLength(5);
});

test('step validation permits local progression, while publication requires every section', () => {
	const stepValues = [
		{ type: 'studio', spaceType: 'entire', maxGuests: 2, bedrooms: 0, beds: 1, bathrooms: 1 },
		{
			address: listing.address,
			latitude: listing.latitude,
			longitude: listing.longitude,
			timeZone: listing.timeZone
		},
		{ amenities: ['wifi'] },
		{ name: listing.name, description: listing.description, imageKeys },
		{
			nightlyPrice: 80.25,
			billingPlanId: 'booking_fee',
			discountPercent: 0,
			supportedPaymentMethods: 'cash',
			minimumStay: 1
		},
		{
			checkInStart: '14:00',
			timeZone: 'Europe/Belgrade',
			checkInEnd: '22:00',
			checkOut: '11:00',
			smokingAllowed: false,
			petsAllowed: false,
			partiesAllowed: false,
			houseRules: ''
		},
		{ cancellationPolicy: ACCOMMODATION_CONFIG.CANCELLATION_DEFAULT_POLICY }
	];
	expect(accommodationSectionSchemas).toHaveLength(stepValues.length);
	for (const [index, values] of stepValues.entries()) {
		expect(accommodationSectionSchemas[index].safeParse(values).success).toBe(true);
		expect(saveAccommodationSchema.safeParse(values).success).toBe(false);
	}
	expect(accommodationSectionSchemas[0].safeParse(emptyListing).success).toBe(true);
	expect(accommodationSectionSchemas[1].safeParse(emptyListing).success).toBe(false);
	expect(
		accommodationSectionSchemas[1].safeParse({
			...emptyListing,
			timeZone: listing.timeZone,
			address: listing.address
		}).success
	).toBe(true);
	expect(saveAccommodationSchema.safeParse(emptyListing).success).toBe(false);
	expect(saveAccommodationSchema.safeParse(listing).success).toBe(true);
	for (const change of [
		{ latitude: 91 },
		{ longitude: -181 },
		{ imageKeys: imageKeys.slice(0, 4) },
		{ nightlyPrice: 1.001 },
		{ maxGuests: 1.5 },
		{ checkInStart: '25:00' },
		{ minimumStay: 0 },
		{ description: '' }
	])
		expect(saveAccommodationSchema.safeParse({ ...listing, ...change }).success).toBe(false);
});

test('save schema preserves every step validation and returns normalized values', () => {
	const invalidSections = [
		{ maxGuests: 0 },
		{ address: { ...listing.address, city: '' } },
		{ amenities: ['unknown'] },
		{ imageKeys: [] },
		{ minimumStay: 0 },
		{ checkInStart: '25:00' },
		{
			cancellationPolicy: {
				version: 1,
				mode: 'custom',
				fiveToSevenDays: 100,
				threeToFiveDays: 0,
				oneToThreeDays: 50,
				under24Hours: 0
			}
		}
	];
	for (const [step, changes] of invalidSections.entries()) {
		const input = { ...listing, ...changes };
		const section = accommodationSectionSchemas[step].safeParse(input);
		const saved = saveAccommodationSchema.safeParse(input);
		expect(section.success).toBe(false);
		expect(saved.success).toBe(false);
		if (!section.success && !saved.success) {
			expect(saved.error.issues).toEqual(expect.arrayContaining(section.error.issues));
		}
	}
	const multipleErrors = saveAccommodationSchema.safeParse({
		...listing,
		type: 'invalid',
		minimumStay: 0
	});
	expect(multipleErrors.success).toBe(false);
	if (!multipleErrors.success) {
		expect(multipleErrors.error.issues.map((issue) => issue.path.join('.'))).toEqual(
			expect.arrayContaining(['type', 'minimumStay'])
		);
	}
	const saved = saveAccommodationSchema.parse({
		...listing,
		name: '  Central apartment  ',
		nightlyPrice: '80.25',
		address: { ...listing.address, country: '  Serbia  ' }
	});
	expect(saved.name).toBe('Central apartment');
	expect(saved.nightlyPrice).toBe(80.25);
	expect(saved.address.country).toBe('Serbia');
});

test('policy step and publication require a complete valid policy and strip inactive custom values', () => {
	const policyStep = accommodationSectionSchemas[6];
	const custom = {
		version: 1,
		mode: 'custom',
		fiveToSevenDays: 100,
		threeToFiveDays: 50,
		oneToThreeDays: 50,
		under24Hours: 0
	} as const;
	expect(policyStep.safeParse({ cancellationPolicy: custom }).success).toBe(true);
	expect(
		saveAccommodationSchema.parse({ ...listing, cancellationPolicy: custom }).cancellationPolicy
	).toEqual(custom);
	for (const cancellationPolicy of [
		undefined,
		{ ...custom, under24Hours: undefined },
		{ ...custom, under24Hours: 25 },
		{ ...custom, under24Hours: 100 },
		{ ...custom, version: 2 }
	]) {
		expect(policyStep.safeParse({ cancellationPolicy }).success).toBe(false);
		expect(saveAccommodationSchema.safeParse({ ...listing, cancellationPolicy }).success).toBe(
			false
		);
	}
	const fullRefundDraft = { ...custom, mode: 'full_refund' };
	expect(
		saveAccommodationSchema.parse({ ...listing, cancellationPolicy: fullRefundDraft })
			.cancellationPolicy
	).toEqual(ACCOMMODATION_CONFIG.CANCELLATION_DEFAULT_POLICY);
});

test('search filters by location, total guests, and rooms', async () => {
	const t = setup();
	const owner = t.withIdentity({ subject: 'host', tokenIdentifier: 'issuer|host' });

	async function publish(suffix: string, overrides: Partial<typeof listing>) {
		const keys = imageKeys.map((key) => `${suffix}-${key}`);
		await t.run(async (ctx) => {
			for (const key of keys)
				await ctx.db.insert('storageUploads', {
					ownerId: 'host',
					key,
					status: 'uploaded',
					createdAt: Date.now()
				});
		});
		await owner.mutation(
			api.tables.accommodations.mutations.createAccommodation.createAccommodation,
			{
				...listing,
				...overrides,
				imageKeys: keys,
				uploadedFiles: keys
			}
		);
	}

	const belgrade = {
		street: 'Knez Mihailova',
		streetNumber: '10A',
		city: 'Belgrade',
		country: 'Serbia'
	};
	await publish('small', { address: belgrade, maxGuests: 2, bedrooms: 1 });
	await publish('large', { address: belgrade, maxGuests: 4, bedrooms: 2 });
	await publish('novi-sad', {
		address: { ...belgrade, street: 'Bulevar Oslobođenja', city: 'Novi Sad' },
		maxGuests: 6,
		bedrooms: 3
	});

	const search =
		api.tables.accommodations.queries.fetchAccommodationsSearch.fetchAccommodationsSearch;
	const base = { paginationOpts: { cursor: null, numItems: 10 } };

	const city = await t.query(search, {
		...base,
		location: { city: 'Belgrade', country: 'Serbia' }
	});
	expect(city.items).toHaveLength(2);
	expect(
		city.items.every((item) => item.imageUrls[0]?.startsWith('https://cdn.example.com/'))
	).toBe(true);

	const guests = await t.query(search, {
		...base,
		location: { city: 'Belgrade', country: 'Serbia' },
		adults: 2,
		children: 1
	});
	expect(guests.items.map((item) => item.maxGuests)).toEqual([4]);

	const rooms = await t.query(search, {
		...base,
		location: { city: 'Belgrade', country: 'Serbia' },
		rooms: 2
	});
	expect(rooms.items.map((item) => item.bedrooms)).toEqual([2]);

	const country = await t.query(search, { ...base, location: { country: 'Serbia' } });
	expect(country.items).toHaveLength(3);

	const elsewhere = await t.query(search, {
		...base,
		location: { city: 'Belgrade', country: 'Portugal' }
	});
	expect(elsewhere.items).toEqual([]);

	const unscoped = await t.query(search, { ...base, location: {} });
	expect(unscoped.items).toEqual([]);
});

test('map search scopes coordinates before pagination and validates bounds', async () => {
	const t = setup();
	const { nightlyPrice, discountPercent: _discount, weekendPrice: _weekend, ...details } = listing;
	await t.run(async (ctx) => {
		for (const [name, latitude, longitude, maxGuests] of [
			['outside longitude', 44, 10, 4],
			['southwest edge', 44, 20, 4],
			['inside', 44.5, 20.5, 2],
			['northeast edge', 45, 21, 4],
			['outside latitude', 46, 20, 4],
			['east date line', 0, 179, 4],
			['west date line', 0, -179, 4]
		] as const) {
			await ctx.db.insert('accommodations', {
				...bookingFeeBilling,
				...details,
				cancellationPolicy: ACCOMMODATION_CONFIG.CANCELLATION_DEFAULT_POLICY,
				name,
				latitude,
				longitude,
				maxGuests,
				ownerId: 'host',
				sameDayReservation: false,
				recommendationSortKey: -3,
				guestRatingAverage: 0,
				guestReviewCount: 0,
				pricePerNightMinor: Math.round(nightlyPrice * 100),
				discountBps: 0,
				weekendPricePerNightMinor: null,
				effectivePricePerNightMinor: Math.round(nightlyPrice * 100),
				status: 'published',
				updatedAt: 1
			});
		}
	});
	const search =
		api.tables.accommodations.queries.fetchAccommodationsSearch.fetchAccommodationsSearch;
	const args = {
		location: { city: 'Paris', country: 'France' },
		bounds: { south: 44, north: 45, west: 20, east: 21 },
		adults: 3,
		rooms: 1,
		paginationOpts: { cursor: null, numItems: 1 }
	};
	const first = await t.query(search, args);
	expect(first.items.map((item) => item.name)).toEqual(['southwest edge']);
	const second = await t.query(search, {
		...args,
		paginationOpts: { ...args.paginationOpts, cursor: first.nextCursor }
	});
	expect(second.items.map((item) => item.name)).toEqual(['northeast edge']);
	const empty = await t.query(search, {
		...args,
		bounds: { south: 30, north: 31, west: 20, east: 21 }
	});
	expect(empty.items).toEqual([]);
	expect(empty.nextCursor).toBeNull();
	const crossing = await t.query(search, {
		...args,
		bounds: { south: -1, north: 1, west: 178, east: -178 },
		paginationOpts: { cursor: null, numItems: 10 }
	});
	expect(crossing.items.map((item) => item.name).sort()).toEqual([
		'east date line',
		'west date line'
	]);
	for (const bounds of [
		{ ...args.bounds, north: 91 },
		{ ...args.bounds, south: 46 },
		{ ...args.bounds, west: -181 },
		{ ...args.bounds, east: Number.NaN }
	]) {
		await expect(t.query(search, { ...args, bounds })).rejects.toThrow();
	}
});

test('public listing mutations validate client timezone and preserve it on non-location edits', async () => {
	const t = setup();
	const owner = t.withIdentity({ subject: 'host', tokenIdentifier: 'issuer|host' });
	const stranger = t.withIdentity({ subject: 'stranger', tokenIdentifier: 'issuer|stranger' });
	const create = api.tables.accommodations.mutations.createAccommodation.createAccommodation;
	const update = api.tables.accommodations.mutations.updateAccommodation.updateAccommodation;
	await expect(t.mutation(create, { ...listing, uploadedFiles: imageKeys })).rejects.toMatchObject({
		data: { code: 'UNAUTHENTICATED' }
	});
	await t.run(async (ctx) => {
		for (const key of imageKeys)
			await ctx.db.insert('storageUploads', {
				ownerId: 'host',
				key,
				status: 'uploaded',
				createdAt: Date.now()
			});
	});
	await expect(
		owner.mutation(create, { ...listing, timeZone: 'invalid', uploadedFiles: imageKeys })
	).rejects.toMatchObject({ data: { code: 'INVALID_ACCOMMODATION' } });
	expect(await t.run((ctx) => ctx.db.query('accommodations').take(1))).toHaveLength(0);
	expect(await t.run((ctx) => ctx.db.query('storageUploads').take(10))).toHaveLength(
		imageKeys.length
	);
	const id = await owner.mutation(create, {
		...listing,
		supportedPaymentMethods: 'both',
		uploadedFiles: imageKeys
	});
	expect((await t.run((ctx) => ctx.db.get('accommodations', id)))?.supportedPaymentMethods).toBe(
		'both'
	);
	expect((await t.run((ctx) => ctx.db.get('accommodations', id)))?.timeZone).toBe(
		'Europe/Belgrade'
	);
	await expect(
		stranger.mutation(update, { id, latitude: 40, longitude: -74, timeZone: 'America/New_York' })
	).rejects.toMatchObject({ data: { code: 'FORBIDDEN' } });
	await owner.mutation(update, {
		id,
		checkOut: '12:00',
		supportedPaymentMethods: 'online',
		timeZone: 'America/New_York'
	});
	expect(await t.run((ctx) => ctx.db.get('accommodations', id))).toMatchObject({
		timeZone: 'Europe/Belgrade',
		checkOut: '12:00',
		supportedPaymentMethods: 'online'
	});
	for (const args of [
		{ latitude: 40 },
		{ latitude: 40, longitude: -74 },
		{ latitude: 40, longitude: -74, timeZone: 'invalid' }
	]) {
		await expect(owner.mutation(update, { id, ...args })).rejects.toMatchObject({
			data: { code: 'INVALID_ACCOMMODATION' }
		});
	}
	await owner.mutation(update, {
		id,
		latitude: 40.7128,
		longitude: -74.006,
		timeZone: 'America/New_York'
	});
	expect(await t.run((ctx) => ctx.db.get('accommodations', id))).toMatchObject({
		latitude: 40.7128,
		longitude: -74.006,
		timeZone: 'America/New_York',
		supportedPaymentMethods: 'online'
	});
});

test('owner deletion soft-deletes the listing, cleans references, and active bookings block it', async () => {
	const t = setup();
	const owner = t.withIdentity({ subject: 'host', tokenIdentifier: 'issuer|host' });
	const stranger = t.withIdentity({ subject: 'stranger', tokenIdentifier: 'issuer|stranger' });
	const remove = api.tables.accommodations.mutations.deleteAccommodation.deleteAccommodation;
	const fetchHeader = api.tables.accommodations.queries.fetchMyAccommodation.fetchMyAccommodation;
	const fetchListing =
		api.tables.accommodations.queries.fetchMyAccommodationListing.fetchMyAccommodationListing;
	const update = api.tables.accommodations.mutations.updateAccommodation.updateAccommodation;
	const updateStatus =
		api.tables.accommodations.mutations.updateAccommodationPublishStatus
			.updateAccommodationPublishStatus;
	const { nightlyPrice, discountPercent: _discount, weekendPrice: _weekend, ...details } = listing;
	const { id, completedBookingId, pendingBookingId, reviewId } = await t.run(async (ctx) => {
		const docId = await ctx.db.insert('accommodations', {
			...bookingFeeBilling,
			...details,
			cancellationPolicy: ACCOMMODATION_CONFIG.CANCELLATION_DEFAULT_POLICY,
			ownerId: 'host',
			sameDayReservation: false,
			recommendationSortKey: -3,
			guestRatingAverage: 0,
			guestReviewCount: 0,
			pricePerNightMinor: Math.round(nightlyPrice * 100),
			discountBps: 0,
			weekendPricePerNightMinor: null,
			effectivePricePerNightMinor: Math.round(nightlyPrice * 100),
			status: 'published',
			updatedAt: 1
		});
		const doc = await ctx.db.get(docId);
		if (doc) await accommodationOwnerAggregate.insert(ctx, doc);
		await ctx.db.insert('favorites', { ownerId: 'guest-one', accommodationId: docId });
		await ctx.db.insert('favorites', { ownerId: 'guest-two', accommodationId: docId });
		await ctx.db.insert('accommodationBlockedDates', {
			accommodationId: docId,
			date: '2027-07-20'
		});
		const insertBooking = (status: 'completed' | 'pending' | 'cancelled') =>
			ctx.db.insert('bookings', {
				platformFeeTerms: null,
				paymentMethod: 'cash',
				accommodationId: docId,
				status,
				firstName: 'Guest',
				lastName: 'Test',
				email: 'guest@example.com',
				phone: '123',
				checkInDate: '2027-07-16',
				checkOutDate: '2027-07-17',
				adults: 1,
				children: 0,
				cancellationTerms: bookingCancellationTerms('2027-07-16', '2027-07-17')
			});
		const completedBookingId = await insertBooking('completed');
		const pendingBookingId = await insertBooking('pending');
		const reviewId = await ctx.db.insert('reviews', {
			bookingId: completedBookingId,
			accommodationId: docId,
			ownerId: 'guest-one',
			authorName: 'Guest',
			stayMonth: '2027-07',
			rating: 5,
			comment: 'Great stay',
			status: 'published'
		});
		const review = await ctx.db.get('reviews', reviewId);
		if (review) await reviewAggregate.insert(ctx, review);
		return { id: docId, completedBookingId, pendingBookingId, reviewId };
	});

	await expect(stranger.mutation(remove, { id })).rejects.toMatchObject({
		data: { code: 'FORBIDDEN' }
	});
	await expect(owner.mutation(remove, { id })).rejects.toMatchObject({
		data: { code: 'ACCOMMODATION_HAS_ACTIVE_BOOKINGS' }
	});

	await t.run((ctx) => ctx.db.patch('bookings', pendingBookingId, { status: 'confirmed' }));
	await expect(owner.mutation(remove, { id })).rejects.toMatchObject({
		data: { code: 'ACCOMMODATION_HAS_ACTIVE_BOOKINGS' }
	});

	await t.run((ctx) => ctx.db.patch('bookings', pendingBookingId, { status: 'cancelled' }));
	await owner.mutation(remove, { id });
	// Repeat deletes are idempotent against the tombstone.
	await owner.mutation(remove, { id });

	await t.run(async (ctx) => {
		const accommodation = await ctx.db.get('accommodations', id);
		expect(accommodation).toMatchObject({
			status: 'deleted',
			deletedBy: 'host',
			imageKeys: []
		});
		expect(accommodation?.deletedAt).toEqual(expect.any(Number));
		expect(await ctx.db.query('favorites').collect()).toEqual([]);
		expect(await ctx.db.query('accommodationBlockedDates').collect()).toEqual([]);
		expect(await accommodationOwnerAggregate.count(ctx, { namespace: 'host' })).toBe(0);
		expect(await reviewAggregate.count(ctx, { namespace: id })).toBe(0);
	});
	expect(await owner.query(fetchHeader, { id })).toBeNull();
	expect(await owner.query(fetchListing, { id })).toBeNull();
	await expect(owner.mutation(update, { id, houseRules: 'No parties' })).rejects.toMatchObject({
		data: { code: 'ACCOMMODATION_NOT_FOUND' }
	});
	await expect(owner.mutation(updateStatus, { id, status: 'published' })).rejects.toMatchObject({
		data: { code: 'ACCOMMODATION_NOT_FOUND' }
	});
	expect(await t.run((ctx) => ctx.db.get('bookings', completedBookingId))).not.toBeNull();
	expect(await t.run((ctx) => ctx.db.get('bookings', pendingBookingId))).not.toBeNull();
	expect(await t.run((ctx) => ctx.db.get('reviews', reviewId))).not.toBeNull();
});

test('search returns only published listings while the owner list hides deleted listings', async () => {
	const t = setup();
	const owner = t.withIdentity({ subject: 'host', tokenIdentifier: 'issuer|host' });
	const { nightlyPrice, discountPercent: _discount, weekendPrice: _weekend, ...details } = listing;
	const base = {
		...details,
		cancellationPolicy: ACCOMMODATION_CONFIG.CANCELLATION_DEFAULT_POLICY,
		ownerId: 'host',
		sameDayReservation: false,
		recommendationSortKey: -3,
		guestRatingAverage: 0,
		guestReviewCount: 0,
		pricePerNightMinor: Math.round(nightlyPrice * 100),
		discountBps: 0,
		weekendPricePerNightMinor: null,
		effectivePricePerNightMinor: Math.round(nightlyPrice * 100),
		updatedAt: 1
	};
	const ids = await t.run(async (ctx) => [
		await ctx.db.insert('accommodations', {
			...bookingFeeBilling,
			...base,
			name: 'Visible stay',
			status: 'published'
		}),
		await ctx.db.insert('accommodations', {
			...bookingFeeBilling,
			...base,
			name: 'Hidden stay',
			status: 'unpublished'
		}),
		await ctx.db.insert('accommodations', {
			...bookingFeeBilling,
			...base,
			name: 'Gone stay',
			status: 'deleted',
			deletedAt: 1,
			deletedBy: 'host'
		})
	]);

	const search =
		api.tables.accommodations.queries.fetchAccommodationsSearch.fetchAccommodationsSearch;
	const page = await t.query(search, {
		location: { country: 'Serbia' },
		paginationOpts: { cursor: null, numItems: 10 }
	});
	expect(page.items.map((item) => item._id)).toEqual([ids[0]]);

	const list = await owner.query(
		api.tables.accommodations.queries.fetchMyAccommodations.fetchMyAccommodations,
		{ paginationOpts: { cursor: null, numItems: 10 } }
	);
	expect(list.items.map((item) => item._id).sort()).toEqual([ids[0], ids[1]].sort());
});

test('admin fee overrides bypass host locks, validate terms, and reject non-admin callers', async () => {
	const t = setup();
	const admin = t.withIdentity({
		subject: 'admin',
		role: 'admin',
		tokenIdentifier: 'issuer|admin'
	});
	const host = t.withIdentity({ subject: 'host', tokenIdentifier: 'issuer|host' });
	const {
		nightlyPrice: _price,
		discountPercent: _discount,
		weekendPrice: _weekend,
		...details
	} = listing;
	const id = await t.run((ctx) =>
		ctx.db.insert('accommodations', {
			...details,
			...bookingFeeBilling,
			ownerId: 'host',
			status: 'unpublished',
			pricePerNightMinor: 10000,
			effectivePricePerNightMinor: 10000,
			discountBps: 0,
			weekendPricePerNightMinor: null,
			recommendationSortKey: -3,
			guestRatingAverage: 0,
			guestReviewCount: 0,
			updatedAt: 1
		})
	);
	const update =
		api.tables.accommodations.mutations.updateAccommodationFeeForAdmin
			.updateAccommodationFeeForAdmin;
	const grant =
		api.tables.accommodations.mutations.grantFreeAccommodationFeeForAdmin
			.grantFreeAccommodationFeeForAdmin;
	const read = api.tables.accommodations.queries.fetchAccommodationsAdmin.fetchAccommodationsAdmin;
	const change =
		api.tables.accommodations.mutations.changeAccommodationBillingPlan
			.changeAccommodationBillingPlan;
	const args = {
		id,
		billingTerms: ACCOMMODATION_BILLING_PLANS.flat_fee,
		billingStatus: 'active' as const,
		billingPeriodEndsAt: Date.now() + 86400000
	};
	await expect(t.mutation(update, args)).rejects.toMatchObject({
		data: { code: 'UNAUTHENTICATED' }
	});
	await expect(host.mutation(update, args)).rejects.toMatchObject({ data: { code: 'FORBIDDEN' } });
	await expect(host.mutation(grant, { id, billingPeriodEndsAt: null })).rejects.toMatchObject({
		data: { code: 'FORBIDDEN' }
	});
	await expect(
		host.query(read, { paginationOpts: { numItems: 10, cursor: null } })
	).rejects.toMatchObject({ data: { code: 'FORBIDDEN' } });
	await admin.mutation(update, args);
	await expect(
		host.mutation(change, { id, billingPlanId: 'booking_fee', expectedBillingPlanId: 'flat_fee' })
	).rejects.toMatchObject({ data: { code: 'ACCOMMODATION_BILLING_PLAN_LOCKED' } });
	await admin.mutation(update, {
		id,
		billingTerms: { model: 'booking_fee', commissionBps: 1250 },
		billingStatus: 'active',
		billingPeriodEndsAt: null
	});
	expect(await t.run((ctx) => ctx.db.get(id))).toMatchObject({
		status: 'unpublished',
		billingPlanId: 'booking_fee',
		billingTerms: { commissionBps: 1250 }
	});
	for (const commissionBps of [-1, 10001, 0.5, Number.NaN])
		await expect(
			admin.mutation(update, {
				id,
				billingTerms: { model: 'booking_fee', commissionBps },
				billingStatus: 'active',
				billingPeriodEndsAt: null
			})
		).rejects.toMatchObject({ data: { code: 'INVALID_ACCOMMODATION' } });
	await expect(
		admin.mutation(update, { ...args, billingPeriodEndsAt: null })
	).rejects.toMatchObject({ data: { code: 'INVALID_ACCOMMODATION' } });
	await expect(
		admin.mutation(update, {
			...args,
			billingTerms: { ...ACCOMMODATION_BILLING_PLANS.flat_fee, amountMinor: 0 }
		})
	).rejects.toMatchObject({ data: { code: 'INVALID_ACCOMMODATION' } });
	await expect(
		admin.mutation(grant, { id, billingPeriodEndsAt: Date.now() - 1 })
	).rejects.toMatchObject({ data: { code: 'INVALID_ACCOMMODATION' } });
	await admin.mutation(grant, { id, billingPeriodEndsAt: null });
	await expect(
		host.mutation(change, { id, billingPlanId: 'free', expectedBillingPlanId: 'free' })
	).rejects.toMatchObject({ data: { code: 'INVALID_ACCOMMODATION' } });
	await expect(
		host.mutation(change, { id, billingPlanId: 'booking_fee', expectedBillingPlanId: 'free' })
	).rejects.toMatchObject({ data: { code: 'ACCOMMODATION_BILLING_PLAN_LOCKED' } });
	await t.run((ctx) => ctx.db.patch(id, { status: 'deleted' }));
	await expect(admin.mutation(grant, { id, billingPeriodEndsAt: null })).rejects.toMatchObject({
		data: { code: 'ACCOMMODATION_NOT_FOUND' }
	});
	await expect(admin.mutation(update, args)).rejects.toMatchObject({
		data: { code: 'ACCOMMODATION_NOT_FOUND' }
	});
});

test('flat-fee refund simulation is admin-only, checks the reviewed period and preserves publication', async () => {
	const t = setup();
	const admin = t.withIdentity({
		subject: 'admin',
		role: 'admin',
		tokenIdentifier: 'issuer|admin'
	});
	const host = t.withIdentity({ subject: 'host', tokenIdentifier: 'issuer|host' });
	const {
		nightlyPrice: _price,
		discountPercent: _discount,
		weekendPrice: _weekend,
		...details
	} = listing;
	const end = Date.now() + 86400000;
	const id = await t.run((ctx) =>
		ctx.db.insert('accommodations', {
			...details,
			...bookingFeeBilling,
			ownerId: 'host',
			status: 'published',
			pricePerNightMinor: 10000,
			effectivePricePerNightMinor: 10000,
			discountBps: 0,
			weekendPricePerNightMinor: null,
			recommendationSortKey: -3,
			guestRatingAverage: 0,
			guestReviewCount: 0,
			updatedAt: 1,
			billingPlanId: 'flat_fee',
			billingTerms: ACCOMMODATION_BILLING_PLANS.flat_fee,
			billingStatus: 'active',
			billingPeriodEndsAt: end
		})
	);
	const refund =
		api.tables.accommodations.mutations.refundFlatFeeForAccommodation.refundFlatFeeForAccommodation;
	const args = { id, expectedBillingPeriodEndsAt: end, expectedUpdatedAt: 1 };
	vi.spyOn(accommodationConfig, 'ACCOMMODATION_PAYMENT_SIMULATION', 'get').mockReturnValue(false);
	try {
		await expect(admin.mutation(refund, args)).rejects.toMatchObject({
			data: { code: 'ACCOMMODATION_PAYMENT_SIMULATION_DISABLED' }
		});
		vi.restoreAllMocks();
		await expect(t.mutation(refund, args)).rejects.toMatchObject({
			data: { code: 'UNAUTHENTICATED' }
		});
		await expect(host.mutation(refund, args)).rejects.toMatchObject({
			data: { code: 'FORBIDDEN' }
		});
		await expect(
			admin.mutation(refund, { ...args, expectedBillingPeriodEndsAt: end + 1 })
		).rejects.toMatchObject({ data: { code: 'ACCOMMODATION_BILLING_PLAN_CHANGED' } });
		await expect(admin.mutation(refund, { ...args, expectedUpdatedAt: 2 })).rejects.toMatchObject({
			data: { code: 'ACCOMMODATION_BILLING_PLAN_CHANGED' }
		});
		await admin.mutation(refund, args);
		expect(await t.run((ctx) => ctx.db.get(id))).toMatchObject({
			status: 'published',
			billingPlanId: 'flat_fee',
			billingTerms: ACCOMMODATION_BILLING_PLANS.flat_fee,
			billingStatus: 'pending_payment',
			billingPeriodEndsAt: null
		});
		await expect(admin.mutation(refund, args)).rejects.toMatchObject({
			data: { code: 'ACCOMMODATION_BILLING_PLAN_CHANGED' }
		});
		await host.mutation(
			api.tables.accommodations.mutations.changeAccommodationBillingPlan
				.changeAccommodationBillingPlan,
			{ id, billingPlanId: 'booking_fee', expectedBillingPlanId: 'flat_fee' }
		);
		await expect(admin.mutation(refund, args)).rejects.toMatchObject({
			data: { code: 'ACCOMMODATION_BILLING_PLAN_CHANGED' }
		});
		await t.run((ctx) =>
			ctx.db.patch(id, {
				billingPlanId: 'flat_fee',
				billingTerms: ACCOMMODATION_BILLING_PLANS.flat_fee,
				billingStatus: 'active',
				billingPeriodEndsAt: end,
				status: 'unpublished',
				updatedAt: 1
			})
		);
		await admin.mutation(refund, args);
		expect(await t.run((ctx) => ctx.db.get(id))).toMatchObject({
			status: 'unpublished',
			billingStatus: 'pending_payment'
		});
		await t.run((ctx) => ctx.db.patch(id, { status: 'deleted' }));
		await expect(admin.mutation(refund, args)).rejects.toMatchObject({
			data: { code: 'ACCOMMODATION_NOT_FOUND' }
		});
	} finally {
		vi.restoreAllMocks();
	}
});

test('free fee grants stay visible, expire to booking fees, and ignore stale expiry jobs', async () => {
	vi.useFakeTimers();
	try {
		vi.setSystemTime(Date.parse('2026-10-07T12:00:00Z'));
		const t = setup();
		const admin = t.withIdentity({
			subject: 'admin',
			role: 'admin',
			tokenIdentifier: 'issuer|admin'
		});
		const {
			nightlyPrice: _price,
			discountPercent: _discount,
			weekendPrice: _weekend,
			...details
		} = listing;
		const id = await t.run((ctx) =>
			ctx.db.insert('accommodations', {
				...details,
				...bookingFeeBilling,
				ownerId: 'host',
				status: 'published',
				pricePerNightMinor: 10000,
				effectivePricePerNightMinor: 10000,
				discountBps: 0,
				weekendPricePerNightMinor: null,
				recommendationSortKey: -3,
				guestRatingAverage: 0,
				guestReviewCount: 0,
				updatedAt: 1
			})
		);
		const grant =
			api.tables.accommodations.mutations.grantFreeAccommodationFeeForAdmin
				.grantFreeAccommodationFeeForAdmin;
		const expire =
			internal.tables.accommodations.mutations.expireFreeAccommodationFee
				.expireFreeAccommodationFee;
		const detail =
			api.tables.accommodations.queries.fetchPublicAccommodation.fetchPublicAccommodation;
		const end = Date.now() + 60000;
		await admin.mutation(grant, { id, billingPeriodEndsAt: end });
		expect(await t.query(detail, { id })).not.toBeNull();
		const search = await t.query(
			api.tables.accommodations.queries.fetchAccommodationsSearch.fetchAccommodationsSearch,
			{ paginationOpts: { numItems: 10, cursor: null }, location: { country: 'Serbia' } }
		);
		expect(search.items.map((item) => item._id)).toContain(id);
		await t.mutation(expire, { id, billingPeriodEndsAt: end });
		expect(await t.run((ctx) => ctx.db.get(id))).toMatchObject({ billingPlanId: 'free' });
		await admin.mutation(grant, { id, billingPeriodEndsAt: null });
		vi.setSystemTime(end);
		await t.finishAllScheduledFunctions(() => vi.runAllTimersAsync());
		expect(await t.run((ctx) => ctx.db.get(id))).toMatchObject({
			billingPlanId: 'free',
			billingPeriodEndsAt: null
		});
		const nextEnd = Date.now() + 60000;
		await admin.mutation(grant, { id, billingPeriodEndsAt: nextEnd });
		await t.run((ctx) => ctx.db.patch(id, { status: 'unpublished' }));
		vi.setSystemTime(nextEnd);
		await t.finishAllScheduledFunctions(() => vi.runAllTimersAsync());
		expect(await t.run((ctx) => ctx.db.get(id))).toMatchObject({
			billingPlanId: 'booking_fee',
			billingTerms: ACCOMMODATION_BILLING_PLANS.booking_fee,
			billingStatus: 'active',
			billingPeriodEndsAt: null,
			status: 'unpublished'
		});
		await admin.mutation(grant, { id, billingPeriodEndsAt: Date.now() + 60000 });
		const oldEnd = Date.now() + 60000;
		await admin.mutation(
			api.tables.accommodations.mutations.updateAccommodationFeeForAdmin
				.updateAccommodationFeeForAdmin,
			{
				id,
				billingTerms: { model: 'booking_fee', commissionBps: 1500 },
				billingStatus: 'active',
				billingPeriodEndsAt: null
			}
		);
		vi.setSystemTime(oldEnd);
		await t.finishAllScheduledFunctions(() => vi.runAllTimersAsync());
		expect(await t.run((ctx) => ctx.db.get(id))).toMatchObject({
			billingPlanId: 'booking_fee',
			billingTerms: { commissionBps: 1500 }
		});
	} finally {
		vi.useRealTimers();
	}
});

test('admin accommodation filters and search combine before pagination', async () => {
	const t = setup();
	const admin = t.withIdentity({
		subject: 'admin',
		role: 'admin',
		tokenIdentifier: 'issuer|admin'
	});
	const {
		nightlyPrice: _price,
		discountPercent: _discount,
		weekendPrice: _weekend,
		...details
	} = listing;
	const ids = await t.run(async (ctx) => {
		const inserted = [];
		for (const status of ['published', 'unpublished', 'deleted'] as const)
			inserted.push(
				await ctx.db.insert('accommodations', {
					...details,
					...bookingFeeBilling,
					name: `AdminFilter ${status}`,
					ownerId: 'host',
					status,
					pricePerNightMinor: 10000,
					effectivePricePerNightMinor: 10000,
					discountBps: 0,
					weekendPricePerNightMinor: null,
					recommendationSortKey: -3,
					guestRatingAverage: 0,
					guestReviewCount: 0,
					updatedAt: 1
				})
			);
		return inserted;
	});
	const query = api.tables.accommodations.queries.fetchAccommodationsAdmin.fetchAccommodationsAdmin;
	const options = {
		paginationOpts: { numItems: 1, cursor: null },
		filters: { status: 'unpublished', billingPlanId: 'booking_fee', billingStatus: 'active' }
	};
	for (const search of [undefined, 'AdminFilter']) {
		const result = await admin.query(query, { ...options, search });
		expect(result.items.map((item) => item._id)).toEqual([ids[1]]);
		expect(result.items[0]).toMatchObject({ ownerId: 'host', billingPlanId: 'booking_fee' });
	}
	const unknown = await admin.query(query, {
		paginationOpts: { numItems: 10, cursor: null },
		filters: { status: 'unknown', billingPlanId: 'unknown' }
	});
	expect(unknown.items).toHaveLength(3);
});
