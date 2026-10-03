/// <reference types="vite/client" />

import actionRetrierTest from '@convex-dev/action-retrier/test';
import aggregateTest from '@convex-dev/aggregate/test';
import r2Test from '@convex-dev/r2/test';
import rateLimiterTest from '@convex-dev/rate-limiter/test';
import { expect, test } from 'vitest';
import { convexTest } from 'convex-test';
import { api, internal } from '../../src/convex/_generated/api';
import schema, { tables } from '../../src/convex/schema';
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { accommodations } from '../../src/convex/tables/accommodations/schema';
import { accommodationOwnerAggregate } from '../../src/convex/tables/accommodations/aggregates/accommodationOwnerAggregate';
import {
	accommodationSectionSchemas,
	saveAccommodationSchema
} from '../../src/shared/features/accommodations/schemas/accommodationSchemas';

import type { AccommodationDetails } from '../../src/shared/features/accommodations/schemas/accommodationSchemas';
import type { FunctionArgs, FunctionReturnType } from 'convex/server';
import type { AccommodationSearchFilters } from '../../src/shared/features/accommodations/schemas/accommodationSchemas';
import { AMENITY_KEYS } from '../../src/shared/features/accommodations/data/accommodationsData';
import { cancellationPolicySchema } from '../../src/shared/features/accommodations/schemas/cancellationPolicySchemas';
import { ACCOMMODATION_CONFIG } from '../../src/shared/features/accommodations/config';

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
	name: 'Central apartment',
	description: 'A comfortable and bright apartment near the city centre.',
	address: { street: 'Knez Mihailova', streetNumber: '10A', city: 'Belgrade', country: 'Serbia' },
	nightlyPrice: 80.25,
	imageKeys
};

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
	const { nightlyPrice, ...details } = listing;
	const base = {
		...details,
		cancellationPolicy: undefined,
		ownerId: 'host',
		recommendationSortKey: -3,
		guestRatingAverage: 0,
		guestReviewCount: 0,
		pricePerNightMinor: Math.round(nightlyPrice * 100),
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
		await ctx.db.insert('accommodations', base),
		await ctx.db.insert('accommodations', { ...base, cancellationPolicy: custom }),
		await ctx.db.insert('accommodations', base)
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

test('list rows and map pins apply the same stay filters through paginated geographic searches', async () => {
	const t = setup();
	const listQuery =
		api.tables.accommodations.queries.fetchAccommodationsSearch.fetchAccommodationsSearch;
	const mapQuery =
		api.tables.accommodations.queries.fetchAccommodationsMapSearch.fetchAccommodationsMap;
	const { nightlyPrice: _nightlyPrice, ...details } = listing;
	const base = {
		...details,
		cancellationPolicy: ACCOMMODATION_CONFIG.CANCELLATION_DEFAULT_POLICY,
		ownerId: 'filter-test',
		recommendationSortKey: -3,
		guestRatingAverage: 0,
		guestReviewCount: 0,
		pricePerNightMinor: 8025,
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
		{ ...base, pricePerNightMinor: 10050, bedrooms: 4 },
		{ ...base, pricePerNightMinor: 8024 },
		{ ...base, pricePerNightMinor: 10051 },
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
		for (const row of variants) inserted.push(await ctx.db.insert('accommodations', row));
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
	const { nightlyPrice: _price, ...details } = listing;
	const base = {
		...details,
		cancellationPolicy: ACCOMMODATION_CONFIG.CANCELLATION_DEFAULT_POLICY,
		imageKeys: [],
		ownerId: 'sorting-test',
		pricePerNightMinor: 9000,
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
			recommendationSortKey: -3,
			guestRatingAverage: 0,
			guestReviewCount: 0,
			address: { ...base.address, city: 'Novi Sad' }
		},
		{ ...base, pricePerNightMinor: 4000 },
		{ ...base, pricePerNightMinor: 1000, recommendationSortKey: -5, bedrooms: 2 },
		{
			...base,
			pricePerNightMinor: 3000,
			recommendationSortKey: -4,
			guestRatingAverage: 0,
			guestReviewCount: 0,
			address: { ...base.address, country: 'Croatia', city: 'Zagreb' }
		},
		{ ...base, pricePerNightMinor: 30000, recommendationSortKey: -5, latitude: 45 },
		{ ...base, pricePerNightMinor: 500, recommendationSortKey: -5, amenities: [] },
		{ ...base, pricePerNightMinor: 5000, recommendationSortKey: -4 }
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
	const { nightlyPrice: _price, ...details } = listing;
	const id = await t.run((ctx) =>
		ctx.db.insert('accommodations', {
			...details,
			cancellationPolicy: ACCOMMODATION_CONFIG.CANCELLATION_DEFAULT_POLICY,
			imageKeys: [],
			ownerId: 'backfill-test',
			recommendationSortKey: -1,
			guestRatingAverage: 0,
			guestReviewCount: 0,
			pricePerNightMinor: 8025,
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
	const { nightlyPrice, ...details } = listing;
	const id = await t.run((ctx) =>
		ctx.db.insert('accommodations', {
			...details,
			cancellationPolicy: ACCOMMODATION_CONFIG.CANCELLATION_DEFAULT_POLICY,
			ownerId: 'private-owner',
			recommendationSortKey: -3,
			guestRatingAverage: 0,
			guestReviewCount: 0,
			pricePerNightMinor: Math.round(nightlyPrice * 100),
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
	const { nightlyPrice, ...details } = listing;
	const id = await t.run((ctx) =>
		ctx.db.insert('accommodations', {
			...details,
			cancellationPolicy: ACCOMMODATION_CONFIG.CANCELLATION_DEFAULT_POLICY,
			ownerId: 'host',
			recommendationSortKey: -3,
			guestRatingAverage: 0,
			guestReviewCount: 0,
			pricePerNightMinor: Math.round(nightlyPrice * 100),
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
		_id: id,
		name: listing.name,
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
	const { nightlyPrice, ...details } = listing;
	const id = await t.run(async (ctx) => {
		const docId = await ctx.db.insert('accommodations', {
			...details,
			cancellationPolicy: ACCOMMODATION_CONFIG.CANCELLATION_DEFAULT_POLICY,
			ownerId: 'host',
			recommendationSortKey: -3,
			guestRatingAverage: 0,
			guestReviewCount: 0,
			pricePerNightMinor: Math.round(nightlyPrice * 100),
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
	await owner.mutation(update, { id, nightlyPrice: 99.5, minimumStay: 3 });

	const updated = await t.run((ctx) => ctx.db.get(id));
	expect(updated).toMatchObject({
		type: 'studio',
		maxGuests: 3,
		pricePerNightMinor: 9950,
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
	const { nightlyPrice, ...details } = listing;
	const id = await t.run(async (ctx) => {
		const id = await ctx.db.insert('accommodations', {
			...details,
			cancellationPolicy: ACCOMMODATION_CONFIG.CANCELLATION_DEFAULT_POLICY,
			ownerId: 'host',
			recommendationSortKey: -3,
			guestRatingAverage: 0,
			guestReviewCount: 0,
			pricePerNightMinor: Math.round(nightlyPrice * 100),
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
	const { nightlyPrice, ...details } = listing;
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
				...details,
				cancellationPolicy: ACCOMMODATION_CONFIG.CANCELLATION_DEFAULT_POLICY,
				name,
				latitude,
				longitude,
				maxGuests,
				ownerId: 'host',
				recommendationSortKey: -3,
				guestRatingAverage: 0,
				guestReviewCount: 0,
				pricePerNightMinor: Math.round(nightlyPrice * 100),
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
	const id = await owner.mutation(create, { ...listing, uploadedFiles: imageKeys });
	expect((await t.run((ctx) => ctx.db.get('accommodations', id)))?.timeZone).toBe(
		'Europe/Belgrade'
	);
	await expect(
		stranger.mutation(update, { id, latitude: 40, longitude: -74, timeZone: 'America/New_York' })
	).rejects.toMatchObject({ data: { code: 'FORBIDDEN' } });
	await owner.mutation(update, { id, checkOut: '12:00', timeZone: 'America/New_York' });
	expect(await t.run((ctx) => ctx.db.get('accommodations', id))).toMatchObject({
		timeZone: 'Europe/Belgrade',
		checkOut: '12:00'
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
		timeZone: 'America/New_York'
	});
});
