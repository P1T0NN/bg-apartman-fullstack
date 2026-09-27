/// <reference types="vite/client" />

import aggregateTest from '@convex-dev/aggregate/test';
import rateLimiterTest from '@convex-dev/rate-limiter/test';
import { expect, test } from 'vitest';
import { convexTest } from 'convex-test';
import { api } from '../../src/convex/_generated/api';
import schema from '../../src/convex/schema';

const modules = import.meta.glob('../../src/convex/**/*.ts');

function setup() {
	const t = convexTest(schema, modules);
	aggregateTest.register(t, 'bookingOwnerAggregate');
	rateLimiterTest.register(t);
	return t;
}

const createBooking = api.tables.bookings.mutations.createBooking.createBooking;

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
	amenities: [],
	imageKeys: [],
	checkInStart: '14:00',
	checkInEnd: '20:00',
	checkOut: '11:00',
	minimumStay: 2,
	maximumStay: 30,
	smokingAllowed: false,
	petsAllowed: false,
	partiesAllowed: false,
	houseRules: '',
	status: 'published' as const,
	updatedAt: Date.now()
};

const guest = {
	firstName: ' Alex ',
	lastName: 'Guest',
	email: 'alex@example.com',
	phone: '+381 64 1234567',
	specialRequests: ''
};

test('createBooking stores a guest request and rejects invalid stays and missing accommodations', async () => {
	const t = setup();
	const accommodationId = await t.run((ctx) => ctx.db.insert('accommodations', accommodation));

	await expect(
		t.mutation(createBooking, {
			accommodationId,
			checkInDate: '2999-10-24',
			checkOutDate: '2999-10-25',
			adults: 2,
			children: 0,
			...guest
		})
	).rejects.toMatchObject({ data: { code: 'INVALID_BOOKING' } });

	await t.mutation(createBooking, {
		accommodationId,
		checkInDate: '2999-10-24',
		checkOutDate: '2999-10-27',
		adults: 2,
		children: 1,
		...guest
	});

	const stored = await t.run((ctx) => ctx.db.query('bookings').take(10));
	expect(stored).toHaveLength(1);
	expect(stored[0]).toMatchObject({
		accommodationId,
		checkInDate: '2999-10-24',
		checkOutDate: '2999-10-27',
		adults: 2,
		children: 1,
		firstName: 'Alex',
		lastName: 'Guest',
		searchText: 'guest alex@example.com'
	});
	expect(stored[0].ownerId).toBeUndefined();
	expect(stored[0].specialRequests).toBeUndefined();

	const missingId = await t.run(async (ctx) => {
		const id = await ctx.db.insert('accommodations', accommodation);
		await ctx.db.delete(id);
		return id;
	});
	await expect(
		t.mutation(createBooking, {
			accommodationId: missingId,
			checkInDate: '2999-10-24',
			checkOutDate: '2999-10-27',
			adults: 2,
			children: 0,
			...guest
		})
	).rejects.toMatchObject({ data: { code: 'ACCOMMODATION_NOT_FOUND' } });
});
