/// <reference types="vite/client" />

import aggregateTest from '@convex-dev/aggregate/test';
import rateLimiterTest from '@convex-dev/rate-limiter/test';
import { expect, test, vi } from 'vitest';
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
const fetchHostBookings = api.tables.bookings.queries.fetchHostBookings.fetchHostBookings;
const updateBookingStatus = api.tables.bookings.mutations.updateBookingStatus.updateBookingStatus;
const hasPendingHostBookings =
	api.tables.bookings.queries.hasPendingHostBookings.hasPendingHostBookings;

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

test('host bookings prioritize the oldest pending requests and the newest other statuses', async () => {
	const t = setup();
	const accommodationId = await t.run((ctx) => ctx.db.insert('accommodations', accommodation));
	const host = t.withIdentity({ subject: 'host-1', tokenIdentifier: 'issuer|host-1' });
	vi.useFakeTimers();
	try {
		const insert = (status: 'pending' | 'confirmed', checkInDate: string, hostId = 'host-1') =>
			t.run((ctx) =>
				ctx.db.insert('bookings', {
					...guest,
					firstName: 'Alex',
					accommodationId,
					hostId,
					status,
					checkInDate,
					checkOutDate: '2999-12-31',
					adults: 2,
					children: 0,
					searchText: 'guest alex@example.com'
				})
			);
		vi.setSystemTime(new Date('2026-09-01T10:00:00Z'));
		const oldest = await insert('pending', '2999-11-01');
		vi.setSystemTime(new Date('2026-09-02T10:00:00Z'));
		const newest = await insert('pending', '2999-10-01');
		vi.setSystemTime(new Date('2026-09-03T10:00:00Z'));
		const far = await insert('confirmed', '2026-11-01');
		vi.setSystemTime(new Date('2026-09-04T10:00:00Z'));
		const past = await insert('confirmed', '2026-09-01');
		vi.setSystemTime(new Date('2026-09-05T10:00:00Z'));
		const near = await insert('confirmed', '2026-10-01');
		vi.setSystemTime(new Date('2026-09-06T10:00:00Z'));
		await insert('confirmed', '2026-09-30', 'host-2');

		const pending = await host.query(fetchHostBookings, {
			paginationOpts: { cursor: null, numItems: 10 },
			filters: { status: 'pending' }
		});
		expect(pending.items.map((item) => item._id)).toEqual([oldest, newest]);
		const ids: string[] = [];
		let cursor: string | null = null;
		for (let pageNumber = 0; pageNumber < 6; pageNumber++) {
			const page: { items: { _id: string }[]; nextCursor: string | null } = await host.query(
				fetchHostBookings,
				{
					paginationOpts: { cursor, numItems: 1 },
					filters: { status: 'confirmed' }
				}
			);
			ids.push(...page.items.map((item) => item._id));
			cursor = page.nextCursor;
			if (cursor === null) break;
		}
		expect(ids).toEqual([near, past, far]);
		expect(cursor).toBeNull();
	} finally {
		vi.useRealTimers();
	}
});

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
		status: 'pending',
		searchText: 'guest alex@example.com'
	});
	expect(stored[0].ownerId).toBeUndefined();
	expect(stored[0].hostId).toBe('host-1');
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

test('signed-in guests own their booking and see it in my-bookings with the owner total', async () => {
	const t = setup();
	const accommodationId = await t.run((ctx) => ctx.db.insert('accommodations', accommodation));
	const signedInGuest = t.withIdentity({ subject: 'guest-1', tokenIdentifier: 'issuer|guest-1' });

	const bookingId = await signedInGuest.mutation(createBooking, {
		accommodationId,
		checkInDate: '2999-10-24',
		checkOutDate: '2999-10-27',
		adults: 2,
		children: 0,
		...guest
	});

	const fetchMyBookings = api.tables.bookings.queries.fetchMyBookings.fetchMyBookings;
	const page = await signedInGuest.query(fetchMyBookings, {
		paginationOpts: { cursor: null, numItems: 10 }
	});
	expect(page.total).toBe(1);
	expect(page.items).toHaveLength(1);
	expect(page.items[0]).toMatchObject({ _id: bookingId, ownerId: 'guest-1', status: 'pending' });
	expect(page.items[0].accommodation).toEqual({
		name: 'Sunny apartment',
		city: 'Belgrade',
		country: 'Serbia',
		imageUrl: null
	});

	const anotherGuest = t.withIdentity({ subject: 'guest-2', tokenIdentifier: 'issuer|guest-2' });
	const otherPage = await anotherGuest.query(fetchMyBookings, {
		paginationOpts: { cursor: null, numItems: 10 }
	});
	expect(otherPage.items).toEqual([]);

	await t.run((ctx) => ctx.db.patch(accommodationId, { imageKeys: ['stays/cover.jpg'] }));
	const withCover = await signedInGuest.query(fetchMyBookings, {
		paginationOpts: { cursor: null, numItems: 10 }
	});
	expect(withCover.items[0].accommodation?.imageUrl).toBe(
		'https://cdn.example.com/stays/cover.jpg'
	);
	expect(withCover.items[0].accommodation).not.toHaveProperty('ownerId');
	expect(withCover.items[0].accommodation).not.toHaveProperty('imageKeys');

	await t.run((ctx) => ctx.db.delete(accommodationId));
	const withoutListing = await signedInGuest.query(fetchMyBookings, {
		paginationOpts: { cursor: null, numItems: 10 }
	});
	expect(withoutListing.items).toHaveLength(1);
	expect(withoutListing.items[0]).toMatchObject({ _id: bookingId, accommodation: null });
	expect(withoutListing.total).toBe(1);

	await expect(
		t.query(fetchMyBookings, { paginationOpts: { cursor: null, numItems: 10 } })
	).rejects.toMatchObject({ data: { code: 'UNAUTHENTICATED' } });
});

test('host manages bookings for their own accommodations', async () => {
	const t = setup();
	const accommodationId = await t.run((ctx) => ctx.db.insert('accommodations', accommodation));
	const host = t.withIdentity({ subject: 'host-1', tokenIdentifier: 'issuer|host-1' });
	const stranger = t.withIdentity({ subject: 'host-2', tokenIdentifier: 'issuer|host-2' });
	expect(await host.query(hasPendingHostBookings, {})).toBe(false);
	await expect(t.query(hasPendingHostBookings, {})).rejects.toMatchObject({
		data: { code: 'UNAUTHENTICATED' }
	});

	const bookingId = await t.mutation(createBooking, {
		accommodationId,
		checkInDate: '2999-10-24',
		checkOutDate: '2999-10-27',
		adults: 2,
		children: 0,
		...guest
	});

	const base = { paginationOpts: { cursor: null, numItems: 10 } };
	expect(await host.query(hasPendingHostBookings, {})).toBe(true);
	expect(await stranger.query(hasPendingHostBookings, {})).toBe(false);
	expect(
		(await host.query(fetchHostBookings, { ...base, filters: { status: 'pending' } })).items
	).toHaveLength(1);
	const page = await host.query(fetchHostBookings, base);
	expect(page.items).toHaveLength(1);
	expect(page.items[0]).toMatchObject({ _id: bookingId, hostId: 'host-1', status: 'pending' });

	expect((await stranger.query(fetchHostBookings, base)).items).toEqual([]);
	await expect(
		stranger.mutation(updateBookingStatus, { id: bookingId, status: 'confirmed' })
	).rejects.toMatchObject({ data: { code: 'BOOKING_NOT_FOUND' } });

	await host.mutation(updateBookingStatus, { id: bookingId, status: 'confirmed' });
	expect(await host.query(hasPendingHostBookings, {})).toBe(false);
	expect(
		(await host.query(fetchHostBookings, { ...base, filters: { status: 'pending' } })).items
	).toEqual([]);
	const confirmed = await host.query(fetchHostBookings, {
		...base,
		filters: { status: 'confirmed' }
	});
	expect(confirmed.items).toHaveLength(1);

	await expect(
		host.mutation(updateBookingStatus, { id: bookingId, status: 'declined' })
	).rejects.toMatchObject({ data: { code: 'INVALID_BOOKING_STATUS' } });

	await host.mutation(updateBookingStatus, { id: bookingId, status: 'completed' });
	await expect(
		host.mutation(updateBookingStatus, { id: bookingId, status: 'cancelled' })
	).rejects.toMatchObject({ data: { code: 'INVALID_BOOKING_STATUS' } });

	const search = await host.query(fetchHostBookings, { ...base, search: 'guest' });
	expect(search.items).toHaveLength(1);

	await expect(t.query(fetchHostBookings, base)).rejects.toMatchObject({
		data: { code: 'UNAUTHENTICATED' }
	});
});
