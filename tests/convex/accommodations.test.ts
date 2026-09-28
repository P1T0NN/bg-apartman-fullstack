/// <reference types="vite/client" />

import actionRetrierTest from '@convex-dev/action-retrier/test';
import aggregateTest from '@convex-dev/aggregate/test';
import r2Test from '@convex-dev/r2/test';
import rateLimiterTest from '@convex-dev/rate-limiter/test';
import { expect, test } from 'vitest';
import { convexTest } from 'convex-test';
import { api } from '../../src/convex/_generated/api';
import schema from '../../src/convex/schema';
import { accommodationOwnerAggregate } from '../../src/convex/tables/accommodations/aggregates/accommodationOwnerAggregate';
import {
	accommodationSectionSchemas,
	saveAccommodationSchema
} from '../../src/shared/features/accommodations/schemas/accommodationSchemas';

import type { AccommodationDetails } from '../../src/shared/features/accommodations/schemas/accommodationSchemas';

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
	checkInEnd: '22:00',
	checkOut: '11:00',
	minimumStay: 1,
	smokingAllowed: false,
	petsAllowed: false,
	partiesAllowed: false,
	houseRules: ''
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

function setup() {
	const t = convexTest(schema, modules);
	r2Test.register(t);
	actionRetrierTest.register(t, 'r2/actionRetrier');
	rateLimiterTest.register(t);
	aggregateTest.register(t, 'accommodationOwnerAggregate');
	return t;
}

test('public details resolve ordered photos without exposing owner or storage keys', async () => {
	const t = setup();
	const { nightlyPrice, ...details } = listing;
	const id = await t.run((ctx) =>
		ctx.db.insert('accommodations', {
			...details,
			ownerId: 'private-owner',
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
			ownerId: 'host',
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
			ownerId: 'host',
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
		ownerId: 'host',
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
	expect(await t.run((ctx) => ctx.db.query('accommodations').take(1))).toEqual([]);
	expect(await t.run((ctx) => ctx.db.query('storageUploads').take(10))).toHaveLength(5);
});

test('step validation permits local progression, while publication requires every section', () => {
	const stepValues = [
		{ type: 'studio', spaceType: 'entire', maxGuests: 2, bedrooms: 0, beds: 1, bathrooms: 1 },
		{ address: listing.address, latitude: listing.latitude, longitude: listing.longitude },
		{ amenities: ['wifi'] },
		{ name: listing.name, description: listing.description, imageKeys },
		{
			nightlyPrice: 80.25,
			minimumStay: 1
		},
		{
			checkInStart: '14:00',
			checkInEnd: '22:00',
			checkOut: '11:00',
			smokingAllowed: false,
			petsAllowed: false,
			partiesAllowed: false,
			houseRules: ''
		}
	];
	for (const [index, values] of stepValues.entries()) {
		expect(accommodationSectionSchemas[index].safeParse(values).success).toBe(true);
		expect(saveAccommodationSchema.safeParse(values).success).toBe(false);
	}
	expect(accommodationSectionSchemas[0].safeParse(emptyListing).success).toBe(true);
	expect(accommodationSectionSchemas[1].safeParse(emptyListing).success).toBe(false);
	expect(
		accommodationSectionSchemas[1].safeParse({
			...emptyListing,
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
		{ checkInStart: '25:00' }
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
	expect(city.items.every((item) => item.coverUrl?.startsWith('https://cdn.example.com/'))).toBe(
		true
	);

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
				name,
				latitude,
				longitude,
				maxGuests,
				ownerId: 'host',
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
