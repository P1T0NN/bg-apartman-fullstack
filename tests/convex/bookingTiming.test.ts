/// <reference types="vite/client" />
import { expect, test } from 'vitest';
import { convexTest } from 'convex-test';
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { internal } from '../../src/convex/_generated/api.js';
import { tables } from '../../src/convex/schema.js';
import {
	bookings,
	bookingCancellationTerms as termsValidator
} from '../../src/convex/tables/bookings/schema.js';
import { bookingCancellationTerms } from '../fixtures/bookingCancellationTerms.js';
import { ACCOMMODATION_CONFIG } from '../../src/shared/features/accommodations/config.js';

const modules = import.meta.glob('../../src/convex/**/*.ts');

test('booking timing backfill is idempotent, preserves snapshots, and gives pre-policy bookings full refund', async () => {
	const legacySchema = defineSchema({
		...tables,
		bookings: defineTable(
			bookings.validator.omit('cancellationTerms').extend({
				cancellationTerms: v.optional(
					termsValidator
						.omit('checkOut', 'checkOutAt')
						.extend({ checkOut: v.optional(v.string()), checkOutAt: v.optional(v.number()) })
				)
			})
		)
	});
	const t = convexTest(legacySchema, modules);
	const customPolicy = {
		version: 1,
		mode: 'custom',
		fiveToSevenDays: 50,
		threeToFiveDays: 50,
		oneToThreeDays: 0,
		under24Hours: 0
	} as const;
	const ids = await t.run(async (ctx) => {
		const accommodationId = await ctx.db.insert('accommodations', {
			ownerId: 'host',
			name: 'Migration property',
			description: 'A comfortable property for testing migration.',
			type: 'apartment',
			spaceType: 'entire',
			address: { street: 'Main', streetNumber: '1', city: 'Belgrade', country: 'Serbia' },
			latitude: 44.8,
			longitude: 20.4,
			maxGuests: 2,
			bedrooms: 1,
			beds: 1,
			bathrooms: 1,
			pricePerNightMinor: 9000,
			sameDayReservation: false,
			recommendationSortKey: -3,
			guestRatingAverage: 0,
			guestReviewCount: 0,
			amenities: [],
			imageKeys: [],
			checkInStart: '14:00',
			timeZone: 'Europe/Belgrade',
			checkInEnd: '22:00',
			checkOut: '11:00',
			minimumStay: 1,
			smokingAllowed: false,
			petsAllowed: false,
			partiesAllowed: false,
			houseRules: '',
			cancellationPolicy: customPolicy,
			status: 'published',
			updatedAt: 1
		});
		const base = {
			accommodationId,
			status: 'pending' as const,
			firstName: 'Guest',
			lastName: 'Test',
			email: 'test@example.com',
			phone: '123',
			checkInDate: '2027-03-27',
			checkOutDate: '2027-03-29',
			adults: 1,
			children: 0
		};
		const preserved = {
			...bookingCancellationTerms(base.checkInDate, base.checkOutDate, 'America/New_York'),
			policy: customPolicy
		};
		const partial = {
			stayType: 'overnight' as const,
			pricePerDayUseMinor: null,
			policy: preserved.policy,
			timeZone: preserved.timeZone,
			checkInStart: preserved.checkInStart,
			checkInAt: preserved.checkInAt,
			pricePerNightMinor: preserved.pricePerNightMinor,
			currency: preserved.currency
		};
		return {
			legacy: await ctx.db.insert('bookings', base),
			partial: await ctx.db.insert('bookings', { ...base, cancellationTerms: partial }),
			complete: await ctx.db.insert('bookings', { ...base, cancellationTerms: preserved }),
			preserved
		};
	});
	const migration = internal.migrations.backfillBookingTiming.backfillBookingTiming;
	for (let run = 0; run < 2; run++) {
		let result = await t.mutation(migration, {
			cursor: null,
			batchSize: 1,
			dryRun: false,
			oneBatchOnly: true
		});
		while (!result.isDone)
			result = await t.mutation(migration, {
				cursor: result.continueCursor,
				batchSize: 1,
				dryRun: false,
				oneBatchOnly: true
			});
	}
	const saved = await t.run(async (ctx) => ({
		legacy: await ctx.db.get('bookings', ids.legacy),
		partial: await ctx.db.get('bookings', ids.partial),
		complete: await ctx.db.get('bookings', ids.complete)
	}));
	expect(saved.legacy?.cancellationTerms).toMatchObject({
		policy: ACCOMMODATION_CONFIG.CANCELLATION_DEFAULT_POLICY,
		timeZone: 'Europe/Belgrade',
		checkOut: '11:00',
		checkOutAt: bookingCancellationTerms('2027-03-27', '2027-03-29').checkOutAt
	});
	expect(saved.partial?.cancellationTerms).toEqual(ids.preserved);
	expect(saved.complete?.cancellationTerms).toEqual(ids.preserved);
});
