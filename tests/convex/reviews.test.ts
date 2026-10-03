/// <reference types="vite/client" />

import { ACCOMMODATION_CONFIG } from '../../src/shared/features/accommodations/config';
import { bookingCancellationTerms } from '../fixtures/bookingCancellationTerms.js';

import aggregateTest from '@convex-dev/aggregate/test';
import rateLimiterTest from '@convex-dev/rate-limiter/test';
import { convexTest } from 'convex-test';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { api } from '../../src/convex/_generated/api';
import schema from '../../src/convex/schema';
import { canReviewBooking } from '../../src/shared/features/reviews/utils/canReviewBooking.js';
import { getReviewDeadline } from '../../src/shared/features/reviews/utils/getReviewDeadline.js';

const modules = import.meta.glob('../../src/convex/**/*.ts');
const createReview = api.tables.reviews.mutations.createReview.createReview;
const fetchReviews = api.tables.reviews.queries.fetchAccommodationReviews.fetchAccommodationReviews;
const fetchEligible =
	api.tables.reviews.queries.fetchEligibleReviewBookings.fetchEligibleReviewBookings;
const fetchBookingReview = api.tables.reviews.queries.fetchBookingReview.fetchBookingReview;
const fetchMyReviews = api.tables.reviews.queries.fetchMyReviews.fetchMyReviews;
const fetchMyReview = api.tables.reviews.queries.fetchMyReview.fetchMyReview;
const moderate = api.tables.reviews.mutations.updateReviewVisibility.updateReviewVisibility;
const fetchPublic =
	api.tables.accommodations.queries.fetchPublicAccommodation.fetchPublicAccommodation;

beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(new Date('2026-09-30T12:00:00Z'));
});
afterEach(() => vi.useRealTimers());

async function setup() {
	const t = convexTest(schema, modules);
	aggregateTest.register(t, 'reviewsAggregate');
	aggregateTest.register(t, 'bookingOwnerAggregate');
	rateLimiterTest.register(t);
	const accommodationId = await t.run((ctx) =>
		ctx.db.insert('accommodations', {
			ownerId: 'host',
			name: 'City apartment',
			description: 'A quiet city stay.',
			type: 'apartment',
			spaceType: 'entire',
			address: { street: 'Main', streetNumber: '12', city: 'Belgrade', country: 'Serbia' },
			latitude: 44.8,
			longitude: 20.4,
			maxGuests: 2,
			bedrooms: 1,
			beds: 1,
			bathrooms: 1,
			pricePerNightMinor: 8000,
			recommendationSortKey: -3,
			guestRatingAverage: 0,
			guestReviewCount: 0,
			amenities: [],
			imageKeys: [],
			checkInStart: '14:00',
			timeZone: 'Europe/Belgrade',
			checkInEnd: '20:00',
			checkOut: '11:00',
			minimumStay: 1,
			smokingAllowed: false,
			petsAllowed: false,
			partiesAllowed: false,
			houseRules: '',
			cancellationPolicy: ACCOMMODATION_CONFIG.CANCELLATION_DEFAULT_POLICY,
			status: 'published',
			updatedAt: Date.now()
		})
	);
	const booking = {
		cancellationTerms: bookingCancellationTerms('2026-09-20', '2026-09-23'),
		accommodationId,
		ownerId: 'guest',
		hostId: 'host',
		status: 'completed' as const,
		firstName: 'Ana',
		lastName: 'Private',
		email: 'private@example.com',
		phone: 'private phone',
		checkInDate: '2026-09-20',
		checkOutDate: '2026-09-23',
		adults: 1,
		children: 0
	};
	const bookingId = await t.run((ctx) => ctx.db.insert('bookings', booking));
	const guest = t.withIdentity({
		subject: 'guest',
		tokenIdentifier: 'issuer|guest',
		name: 'Ana Private'
	});
	const stranger = t.withIdentity({ subject: 'stranger', tokenIdentifier: 'issuer|stranger' });
	const admin = t.withIdentity({
		subject: 'admin',
		tokenIdentifier: 'issuer|admin',
		role: 'admin'
	});
	return { t, guest, stranger, admin, accommodationId, bookingId, booking };
}

test('author review history is paginated, private and retains hidden or removed-listing receipts', async () => {
	const { t, guest, stranger, admin, accommodationId, bookingId, booking } = await setup();
	const firstId = await guest.mutation(createReview, {
		bookingId,
		rating: 4,
		comment: 'My first stay.'
	});
	vi.setSystemTime(new Date('2026-09-30T12:01:00Z'));
	const secondBookingId = await t.run((ctx) => ctx.db.insert('bookings', booking));
	const secondId = await guest.mutation(createReview, {
		bookingId: secondBookingId,
		rating: 5,
		comment: 'My second stay.'
	});
	const foreignBookingId = await t.run((ctx) =>
		ctx.db.insert('bookings', { ...booking, ownerId: 'stranger' })
	);
	const foreignId = await stranger.mutation(createReview, {
		bookingId: foreignBookingId,
		rating: 1,
		comment: 'Another guest.'
	});
	await admin.mutation(moderate, {
		id: secondId,
		status: 'hidden',
		reason: 'Contains personal information'
	});
	const args = { paginationOpts: { cursor: null, numItems: 1 } };
	const firstPage = await guest.query(fetchMyReviews, args);
	expect(firstPage.items.map((review) => review._id)).toEqual([secondId]);
	expect(firstPage.items[0].status).toBe('hidden');
	expect(firstPage.hasNextPage).toBe(true);
	const secondPage = await guest.query(fetchMyReviews, {
		paginationOpts: { cursor: firstPage.nextCursor, numItems: 1 }
	});
	expect(secondPage.items.map((review) => review._id)).toEqual([firstId]);
	expect(secondPage.hasNextPage).toBe(false);
	expect(await guest.query(fetchMyReview, { id: foreignId })).toBeNull();
	expect(await stranger.query(fetchMyReview, { id: firstId })).toBeNull();
	await expect(t.query(fetchMyReviews, args)).rejects.toMatchObject({
		data: { code: 'UNAUTHENTICATED' }
	});
	await expect(t.query(fetchMyReview, { id: firstId })).rejects.toMatchObject({
		data: { code: 'UNAUTHENTICATED' }
	});
	const receipt = await guest.query(fetchMyReview, { id: secondId });
	expect(receipt).toMatchObject({
		accommodationName: 'City apartment',
		checkInDate: booking.checkInDate,
		checkOutDate: booking.checkOutDate,
		status: 'hidden'
	});
	expect(receipt).not.toHaveProperty('ownerId');
	expect(receipt).not.toHaveProperty('moderationReason');
	expect(receipt).not.toHaveProperty('moderatedBy');
	await t.run((ctx) => ctx.db.delete(accommodationId));
	expect(await guest.query(fetchMyReview, { id: secondId })).toMatchObject({
		accommodationName: null,
		comment: 'My second stay.'
	});
	expect((await guest.query(fetchMyReviews, args)).items[0].accommodationName).toBeNull();
	await t.run((ctx) => ctx.db.delete(firstId));
	expect(await guest.query(fetchMyReview, { id: firstId })).toBeNull();
});

test('one immutable review per booking, and another completed stay earns another review', async () => {
	const { t, guest, accommodationId, bookingId, booking } = await setup();
	const firstId = await guest.mutation(createReview, {
		bookingId,
		rating: 5,
		comment: '  A comfortable stay.  '
	});
	expect(await t.run((ctx) => ctx.db.get(bookingId))).toMatchObject({ reviewId: firstId });
	await expect(
		guest.mutation(createReview, { bookingId, rating: 1, comment: 'Trying to change it.' })
	).rejects.toMatchObject({ data: { code: 'REVIEW_ALREADY_EXISTS' } });
	const secondBookingId = await t.run((ctx) =>
		ctx.db.insert('bookings', { ...booking, checkInDate: '2026-09-25', checkOutDate: '2026-09-28' })
	);
	await guest.mutation(createReview, {
		bookingId: secondBookingId,
		rating: 3,
		comment: 'Another real stay.'
	});
	const details = await t.query(fetchPublic, { id: accommodationId });
	expect(details?.reviews).toEqual({ count: 2, average: 4, distribution: [1, 0, 1, 0, 0] });
	expect(details).not.toHaveProperty('recommendationSortKey');
	expect(
		(await t.run((ctx) => ctx.db.get('accommodations', accommodationId)))?.recommendationSortKey
	).toBeCloseTo(-23 / 7);
	const own = await guest.query(fetchBookingReview, { bookingId });
	expect(own.review).toMatchObject({
		authorName: 'Ana',
		comment: 'A comfortable stay.',
		rating: 5,
		stayMonth: '2026-09'
	});
});

test('rejects unauthenticated, foreign, incomplete, future, expired and self-booked reviews', async () => {
	const { t, guest, stranger, bookingId, booking, accommodationId } = await setup();
	const args = { bookingId, rating: 4, comment: 'A real experience.' };
	await expect(t.mutation(createReview, args)).rejects.toMatchObject({
		data: { code: 'UNAUTHENTICATED' }
	});
	await expect(stranger.mutation(createReview, args)).rejects.toMatchObject({
		data: { code: 'BOOKING_NOT_FOUND' }
	});
	await expect(stranger.query(fetchBookingReview, { bookingId })).rejects.toMatchObject({
		data: { code: 'BOOKING_NOT_FOUND' }
	});
	for (const status of ['pending', 'confirmed', 'cancelled', 'declined'] as const) {
		await t.run((ctx) => ctx.db.patch(bookingId, { status }));
		await expect(guest.mutation(createReview, args)).rejects.toMatchObject({
			data: { code: 'REVIEW_NOT_ELIGIBLE' }
		});
	}
	await t.run((ctx) =>
		ctx.db.patch(bookingId, {
			status: 'completed',
			checkOutDate: '2026-10-01',
			cancellationTerms: bookingCancellationTerms(booking.checkInDate, '2026-10-01')
		})
	);
	await expect(guest.mutation(createReview, args)).rejects.toMatchObject({
		data: { code: 'REVIEW_NOT_ELIGIBLE' }
	});
	await t.run((ctx) => ctx.db.patch(bookingId, { checkOutDate: '2026-06-01' }));
	await expect(guest.mutation(createReview, args)).rejects.toMatchObject({
		data: { code: 'REVIEW_NOT_ELIGIBLE' }
	});
	await t.run((ctx) =>
		ctx.db.patch(bookingId, {
			checkOutDate: booking.checkOutDate,
			cancellationTerms: booking.cancellationTerms,
			hostId: 'guest'
		})
	);
	await expect(guest.mutation(createReview, args)).rejects.toMatchObject({
		data: { code: 'REVIEW_NOT_ELIGIBLE' }
	});
	await t.run((ctx) => ctx.db.patch(bookingId, { hostId: 'host' }));
	await t.run((ctx) => ctx.db.patch(accommodationId, { ownerId: 'guest' }));
	await expect(guest.mutation(createReview, args)).rejects.toMatchObject({
		data: { code: 'FORBIDDEN' }
	});
	expect(await t.run((ctx) => ctx.db.query('reviews').take(1))).toEqual([]);
});

test('validates review input and enforces the exact 90-day boundary using the server clock', async () => {
	const { t, guest, bookingId, booking } = await setup();
	for (const rating of [0, 6, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
		await expect(
			guest.mutation(createReview, { bookingId, rating, comment: 'Valid text.' })
		).rejects.toMatchObject({ data: { code: 'INVALID_REVIEW' } });
	}
	for (const comment of ['', '  ', 'x'.repeat(2001)]) {
		await expect(
			guest.mutation(createReview, { bookingId, rating: 5, comment })
		).rejects.toMatchObject({ data: { code: 'INVALID_REVIEW' } });
	}
	const checkout = '2026-07-02';
	await t.run((ctx) =>
		ctx.db.patch(bookingId, {
			checkInDate: '2026-07-01',
			checkOutDate: checkout,
			cancellationTerms: bookingCancellationTerms('2026-07-01', checkout)
		})
	);
	const deadline = getReviewDeadline(checkout, booking.cancellationTerms.timeZone);
	vi.setSystemTime(deadline);
	await expect(
		guest.mutation(createReview, { bookingId, rating: 5, comment: 'Too late.' })
	).rejects.toMatchObject({ data: { code: 'REVIEW_NOT_ELIGIBLE' } });
	vi.setSystemTime(deadline - 1);
	await guest.mutation(createReview, { bookingId, rating: 5, comment: 'Just in time.' });
	expect(
		canReviewBooking(
			{ status: 'completed', checkOutDate: checkout, cancellationTerms: booking.cancellationTerms },
			deadline
		)
	).toBe(false);
});

test('public pagination and star filters expose no booking, account or moderation data', async () => {
	const { t, guest, accommodationId, bookingId, booking } = await setup();
	await guest.mutation(createReview, {
		bookingId,
		rating: 1,
		comment: 'An honest critical review.'
	});
	vi.setSystemTime(new Date('2026-09-30T12:01:00Z'));
	const second = await t.run((ctx) => ctx.db.insert('bookings', booking));
	await guest.mutation(createReview, { bookingId: second, rating: 5, comment: 'A better stay.' });
	const base = { accommodationId, paginationOpts: { cursor: null, numItems: 1 } };
	const firstPage = await t.query(fetchReviews, base);
	expect(firstPage.items.map((review) => review.rating)).toEqual([5]);
	expect(firstPage.total).toBe(2);
	expect(firstPage.hasNextPage).toBe(true);
	const secondPage = await t.query(fetchReviews, {
		...base,
		paginationOpts: { cursor: firstPage.nextCursor, numItems: 1 }
	});
	expect(secondPage.items.map((review) => review.rating)).toEqual([1]);
	expect(secondPage.hasNextPage).toBe(false);
	expect(Object.keys(firstPage.items[0]).sort()).toEqual(
		['_creationTime', '_id', 'authorName', 'comment', 'rating', 'stayMonth'].sort()
	);
	const filtered = await t.query(fetchReviews, { ...base, rating: 1 });
	expect(filtered.items.map((review) => review.rating)).toEqual([1]);
	expect(filtered.total).toBeUndefined();
});

test('moderation atomically updates public scores without allowing replacement reviews', async () => {
	const { t, guest, admin, accommodationId, bookingId } = await setup();
	const id = await guest.mutation(createReview, {
		bookingId,
		rating: 2,
		comment: 'Private information needs moderation.'
	});
	const initialSortKey = (await t.run((ctx) => ctx.db.get('accommodations', accommodationId)))
		?.recommendationSortKey;
	expect(initialSortKey).toBeCloseTo(-17 / 6);
	await expect(
		guest.mutation(moderate, { id, status: 'hidden', reason: 'Not allowed' })
	).rejects.toMatchObject({ data: { code: 'FORBIDDEN' } });
	await expect(
		admin.mutation(moderate, { id, status: 'hidden', reason: ' ' })
	).rejects.toMatchObject({ data: { code: 'INVALID_REVIEW' } });
	await admin.mutation(moderate, { id, status: 'hidden', reason: 'Contains personal information' });
	await admin.mutation(moderate, { id, status: 'hidden', reason: 'Same state is idempotent' });
	expect(
		(await t.run((ctx) => ctx.db.get('accommodations', accommodationId)))?.recommendationSortKey
	).toBe(-3);
	expect((await t.query(fetchPublic, { id: accommodationId }))?.reviews).toEqual({
		count: 0,
		average: null,
		distribution: [0, 0, 0, 0, 0]
	});
	expect(
		(
			await t.query(fetchReviews, {
				accommodationId,
				paginationOpts: { cursor: null, numItems: 10 }
			})
		).items
	).toEqual([]);
	expect((await guest.query(fetchBookingReview, { bookingId })).review?.status).toBe('hidden');
	await expect(
		guest.mutation(createReview, { bookingId, rating: 5, comment: 'Replacement review.' })
	).rejects.toMatchObject({ data: { code: 'REVIEW_ALREADY_EXISTS' } });
	await admin.mutation(moderate, { id, status: 'published', reason: 'Reviewed and restored' });
	expect(
		(await t.run((ctx) => ctx.db.get('accommodations', accommodationId)))?.recommendationSortKey
	).toBe(initialSortKey);
	expect((await t.query(fetchPublic, { id: accommodationId }))?.reviews).toEqual({
		count: 1,
		average: 2,
		distribution: [0, 0, 0, 1, 0]
	});
	expect((await t.run((ctx) => ctx.db.get(id)))?.moderationReason).toBe('Reviewed and restored');
});

test('guest rating sort fields follow the public threshold and review moderation', async () => {
	const { t, guest, admin, accommodationId, bookingId, booking } = await setup();
	const first = await guest.mutation(createReview, {
		bookingId,
		rating: 5,
		comment: 'Great stay.'
	});
	for (const rating of [4, 3]) {
		const id = await t.run((ctx) => ctx.db.insert('bookings', booking));
		await guest.mutation(createReview, { bookingId: id, rating, comment: 'A real stay.' });
	}
	expect(await t.run((ctx) => ctx.db.get('accommodations', accommodationId))).toMatchObject({
		guestRatingAverage: 4,
		guestReviewCount: 3
	});
	const details = await t.query(fetchPublic, { id: accommodationId });
	expect(details).not.toHaveProperty('guestRatingAverage');
	expect(details).not.toHaveProperty('guestReviewCount');
	await admin.mutation(moderate, { id: first, status: 'hidden', reason: 'Needs moderation' });
	expect(await t.run((ctx) => ctx.db.get('accommodations', accommodationId))).toMatchObject({
		guestRatingAverage: 0,
		guestReviewCount: 2
	});
	await admin.mutation(moderate, { id: first, status: 'published', reason: 'Restored' });
	expect(await t.run((ctx) => ctx.db.get('accommodations', accommodationId))).toMatchObject({
		guestRatingAverage: 4,
		guestReviewCount: 3
	});
});

test('eligible booking pages exclude reviewed, expired, future, foreign and unclaimed stays', async () => {
	const { t, guest, stranger, accommodationId, bookingId, booking } = await setup();
	for (const overrides of [
		{ status: 'confirmed' as const },
		{ ownerId: 'stranger' },
		{ ownerId: undefined },
		{ checkOutDate: '2026-01-01' },
		{ checkOutDate: '2027-01-01' }
	])
		await t.run((ctx) =>
			ctx.db.insert('bookings', {
				...booking,
				...overrides,
				cancellationTerms: bookingCancellationTerms(
					booking.checkInDate,
					overrides.checkOutDate ?? booking.checkOutDate
				)
			})
		);
	const base = {
		accommodationId,
		now: Date.now(),
		paginationOpts: { cursor: null, numItems: 10 }
	};
	expect((await guest.query(fetchEligible, base)).items.map((item) => item._id)).toEqual([
		bookingId
	]);
	expect((await stranger.query(fetchEligible, base)).items).toHaveLength(1);
	await guest.mutation(createReview, { bookingId, rating: 4, comment: 'My completed stay.' });
	expect((await guest.query(fetchEligible, base)).items).toEqual([]);
	await expect(t.query(fetchEligible, base)).rejects.toMatchObject({
		data: { code: 'UNAUTHENTICATED' }
	});
	await expect(guest.query(fetchEligible, { ...base, now: Number.NaN })).rejects.toMatchObject({
		data: { code: 'INVALID_REVIEW' }
	});
	await expect(
		guest.query(api.tables.reviews.queries.fetchReviewsAdmin.fetchReviewsAdmin, {
			paginationOpts: base.paginationOpts
		})
	).rejects.toMatchObject({ data: { code: 'FORBIDDEN' } });
});

test('support can complete a verified confirmed stay while preserving lifecycle and timing guards', async () => {
	const { t, guest, admin, bookingId } = await setup();
	const complete = api.tables.bookings.mutations.completeBookingAdmin.completeBookingAdmin;
	const args = { bookingId, reason: 'Verified checkout with the guest and host.' };
	await t.run((ctx) => ctx.db.patch(bookingId, { status: 'confirmed' }));
	await expect(guest.mutation(complete, args)).rejects.toMatchObject({
		data: { code: 'FORBIDDEN' }
	});
	await admin.mutation(complete, args);
	expect(await t.run((ctx) => ctx.db.get(bookingId))).toMatchObject({
		status: 'completed',
		completedBy: 'admin',
		completionNote: args.reason
	});
	await guest.mutation(createReview, {
		bookingId,
		rating: 5,
		comment: 'Support resolved my stay.'
	});
	await t.run((ctx) => ctx.db.patch(bookingId, { status: 'cancelled' }));
	await expect(admin.mutation(complete, args)).rejects.toMatchObject({
		data: { code: 'INVALID_BOOKING_STATUS' }
	});
	await t.run((ctx) =>
		ctx.db.patch(bookingId, {
			status: 'confirmed',
			checkOutDate: '2027-01-01',
			cancellationTerms: bookingCancellationTerms('2026-12-28', '2027-01-01')
		})
	);
	await expect(admin.mutation(complete, args)).rejects.toMatchObject({
		data: { code: 'BOOKING_NOT_FINISHED' }
	});
});

test('concurrent submissions create exactly one review and one aggregate contribution', async () => {
	const { t, guest, accommodationId, bookingId } = await setup();
	const submissions = await Promise.allSettled([
		guest.mutation(createReview, { bookingId, rating: 5, comment: 'First submission.' }),
		guest.mutation(createReview, { bookingId, rating: 1, comment: 'Concurrent submission.' })
	]);
	expect(submissions.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
	expect(
		await t.run((ctx) =>
			ctx.db
				.query('reviews')
				.withIndex('by_booking_id', (q) => q.eq('bookingId', bookingId))
				.take(2)
		)
	).toHaveLength(1);
	expect((await t.query(fetchPublic, { id: accommodationId }))?.reviews.count).toBe(1);
});

test('completion and review eligibility use the frozen property checkout instant across UTC dates and DST', async () => {
	for (const timeZone of ['Pacific/Kiritimati', 'America/Los_Angeles', 'Europe/Belgrade']) {
		const { t, guest, admin, accommodationId, bookingId } = await setup();
		const terms = bookingCancellationTerms('2027-03-26', '2027-03-28', timeZone);
		await t.run((ctx) =>
			ctx.db.patch(bookingId, {
				status: 'confirmed',
				checkInDate: '2027-03-26',
				checkOutDate: '2027-03-28',
				cancellationTerms: terms
			})
		);
		await t.run((ctx) => ctx.db.patch(accommodationId, { timeZone: 'UTC', checkOut: '23:30' }));
		vi.setSystemTime(terms.checkOutAt - 1);
		const complete = api.tables.bookings.mutations.completeBookingAdmin.completeBookingAdmin;
		const completion = { bookingId, reason: 'Verified actual checkout.' };
		await expect(admin.mutation(complete, completion)).rejects.toMatchObject({
			data: { code: 'BOOKING_NOT_FINISHED' }
		});
		const eligibility = {
			accommodationId,
			now: Date.now(),
			paginationOpts: { cursor: null, numItems: 10 }
		};
		expect((await guest.query(fetchEligible, eligibility)).items).toEqual([]);
		vi.setSystemTime(terms.checkOutAt);
		await admin.mutation(complete, completion);
		// A forged refresh clock must not change server-authoritative eligibility.
		expect((await guest.query(fetchEligible, { ...eligibility, now: 0 })).items).toMatchObject([
			{ _id: bookingId, timeZone }
		]);
		await guest.mutation(createReview, {
			bookingId,
			rating: 5,
			comment: 'Checked out in property local time.'
		});
		expect((await t.run((ctx) => ctx.db.get('bookings', bookingId)))?.cancellationTerms).toEqual(
			terms
		);
	}
});
