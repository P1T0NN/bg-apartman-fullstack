// LIBRARIES
import { v } from 'convex/values';

// CONVEX
import { internalMutation } from './_generated/server.js';

// AGGREGATES
import { accommodationOwnerAggregate } from './tables/accommodations/aggregates/accommodationOwnerAggregate.js';
import { reviewAggregate } from './tables/reviews/aggregates/reviewAggregate.js';

// HELPERS
import { updateAccommodationReviewSortKeys } from './tables/accommodations/helpers/updateAccommodationReviewSortKeys.js';

// CONFIG
import { ACCOMMODATION_CONFIG } from '../shared/features/accommodations/config.js';

// DATA
import { AMENITY_KEYS } from '../shared/features/accommodations/data/accommodationsData.js';
import { ACCOMMODATION_TYPES } from '../shared/features/accommodations/types/accommodationTypes.js';

// TYPES
import type { Doc } from './_generated/dataModel.js';
import type { WithoutSystemFields } from 'convex/server';

const SEED_OWNER_ID = 'seed-owner';
const IMAGE_COUNT = 5;

type SeedCity = {
	city: string;
	country: string;
	latitude: number;
	longitude: number;
	count: number;
};

const SEED_CITIES: SeedCity[] = [
	{ city: 'Belgrade', country: 'Serbia', latitude: 44.8125, longitude: 20.4612, count: 40 },
	{ city: 'Novi Sad', country: 'Serbia', latitude: 45.2671, longitude: 19.8335, count: 20 },
	{ city: 'Niš', country: 'Serbia', latitude: 43.3209, longitude: 21.8958, count: 15 },
	{ city: 'Kragujevac', country: 'Serbia', latitude: 44.0128, longitude: 20.9114, count: 10 },
	{ city: 'Subotica', country: 'Serbia', latitude: 46.1005, longitude: 19.6657, count: 5 },
	{ city: 'Budapest', country: 'Hungary', latitude: 47.4979, longitude: 19.0402, count: 5 },
	{ city: 'Zagreb', country: 'Croatia', latitude: 45.815, longitude: 15.9819, count: 3 },
	{
		city: 'Sarajevo',
		country: 'Bosnia and Herzegovina',
		latitude: 43.8563,
		longitude: 18.4131,
		count: 2
	}
];

const SEED_CITY_POOL = SEED_CITIES.flatMap((city) =>
	Array.from({ length: city.count }, () => city)
);

const ADJECTIVES = [
	'Sunny',
	'Cozy',
	'Modern',
	'Charming',
	'Bright',
	'Quiet',
	'Rustic',
	'Elegant',
	'Central',
	'Green',
	'Warm',
	'Stylish'
] as const;

const NOUNS = [
	'Loft',
	'Retreat',
	'Nest',
	'Hideaway',
	'Corner',
	'Skyline',
	'Garden',
	'Atelier',
	'Terrace',
	'Haven'
] as const;

const SPACE_TYPES = ['entire', 'entire', 'entire', 'private', 'shared'] as const;

const STREETS = [
	'Knez Mihailova',
	'Cara Dušana',
	'Bulevar Oslobođenja',
	'Njegoševa',
	'Vuka Karadžića',
	'Zmaj Jovina',
	'Kralja Petra',
	'Makedonska',
	'Gundulićeva',
	'Ilica',
	'Váci utca',
	'Ferhadija'
] as const;

const CHECK_IN_STARTS = ['14:00', '15:00', '16:00'] as const;
const CHECK_IN_ENDS = ['21:00', '22:00', '23:00'] as const;
const CHECK_OUTS = ['10:00', '11:00', '12:00'] as const;

const HOUSE_RULES = [
	'No smoking indoors. Quiet hours after 22:00. Treat the space like your own.',
	'Please remove your shoes at the entrance. No parties. Check out on time.',
	'Pets welcome on request. Keep noise down after 22:00 and leave the kitchen clean.',
	'No smoking inside. Separate waste and lock the door when leaving.'
] as const;

const SEED_GUEST_PREFIX = 'seed-guest-';

const SEED_REVIEWER_NAMES = [
	'Mila Petrović',
	'Nikola Jovanović',
	'Sara Ilić',
	'Luka Marković',
	'Ema Stojanović',
	'Vuk Nikolić',
	'Ana Pavlović',
	'Iva Milošević',
	'Filip Đorđević',
	'Tea Kovačević',
	'Mina Popović',
	'Stefan Ristić'
] as const;

// Weighted toward positive ratings so seeded averages look realistic.
const SEED_REVIEW_RATINGS = [5, 5, 5, 4, 4, 4, 3, 3, 2] as const;

const SEED_REVIEW_COMMENTS = [
	'Great location and a very clean apartment. The host replied quickly and check-in was easy.',
	'Comfortable stay, exactly as described. Would book again for a city trip.',
	'Nice place with everything we needed. The neighbourhood is quiet at night.',
	'Spacious and bright, with a well-equipped kitchen. A short walk to the centre.',
	'Good value for the price. The bed was comfortable and the wifi was fast.',
	'Lovely apartment and a thoughtful host. We especially enjoyed the balcony.',
	'Clean and tidy, though the street was a bit noisy in the morning.',
	'The photos match the apartment. Check-in instructions were clear and simple.',
	'Perfect base for exploring the city. Plenty of restaurants and shops nearby.',
	'We had a pleasant stay. A minor issue with the hot water, but the host fixed it quickly.',
	'The apartment is in a great spot for sightseeing. Everything was spotless when we arrived.',
	'Comfortable beds and a quiet building. The host left us some local tips, which was a nice touch.'
] as const;

function createRandom(seed: number): () => number {
	let state = seed;
	return () => {
		state = (state + 0x6d2b79f5) | 0;
		let value = Math.imul(state ^ (state >>> 15), 1 | state);
		value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
		return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
	};
}

function pick<T>(items: readonly T[], random: () => number): T {
	const item = items[Math.floor(random() * items.length)];
	if (item === undefined) throw new Error('Cannot pick from an empty seed list.');
	return item;
}

function pickCity(index: number): SeedCity {
	const city = SEED_CITY_POOL[index % SEED_CITY_POOL.length];
	if (!city) throw new Error('Seed city pool is empty.');
	return city;
}

function pickAmenities(random: () => number): string[] {
	const pool = [...AMENITY_KEYS];
	const count = 4 + Math.floor(random() * 5);
	const picked: string[] = [];
	for (let index = 0; index < count && pool.length > 0; index += 1) {
		const [amenity] = pool.splice(Math.floor(random() * pool.length), 1);
		if (amenity !== undefined) picked.push(amenity);
	}
	return picked;
}

function buildImageKeys(index: number): string[] {
	return Array.from(
		{ length: IMAGE_COUNT },
		(_, imageIndex) => `https://picsum.photos/seed/bgapartman-${index}-${imageIndex}/800/600`
	);
}

/** Dev-only: insert `count` realistic published accommodations owned by `ownerId`. */
export const seedAccommodations = internalMutation({
	args: {
		count: v.optional(v.number()),
		ownerId: v.optional(v.string()),
		/** Concentrate all rows in Belgrade for the search-map benchmark. */
		denseBelgrade: v.optional(v.boolean()),
		/** Keep deterministic batches distinct when seeding more than 500 rows. */
		offset: v.optional(v.number())
	},
	returns: v.number(),
	handler: async (ctx, args) => {
		const count = Math.min(Math.max(Math.floor(args.count ?? 100), 1), 500);
		const ownerId = args.ownerId?.trim() || SEED_OWNER_ID;
		const offset = args.offset ?? 0;
		if (!Number.isSafeInteger(offset) || offset < 0) throw new Error('Invalid seed offset.');

		for (let index = 0; index < count; index += 1) {
			const seedIndex = offset + index;
			const random = createRandom(1_000 + seedIndex);
			const city = pickCity(args.denseBelgrade ? 0 : seedIndex);
			const type = pick(ACCOMMODATION_TYPES, random);
			const spaceType = pick(SPACE_TYPES, random);
			const maxGuests = 2 + Math.floor(random() * 7);
			const bedrooms = 1 + Math.floor(random() * 4);
			const beds = bedrooms + Math.floor(random() * 3);
			const bathrooms = 1 + Math.floor(random() * 3);
			const amenities = pickAmenities(random);
			const minimumStay = 1 + Math.floor(random() * 5);
			const adjective = pick(ADJECTIVES, random);
			const noun = pick(NOUNS, random);

			const listing: WithoutSystemFields<Doc<'accommodations'>> = {
				ownerId,
				name: `${adjective} ${noun} ${type}`,
				description: `A ${adjective.toLowerCase()} ${type} with ${bedrooms} bedroom${bedrooms === 1 ? '' : 's'} in the centre of ${city.city}. Sleeps up to ${maxGuests} guests across ${beds} bed${beds === 1 ? '' : 's'} and ${bathrooms} bathroom${bathrooms === 1 ? '' : 's'}. Comes with ${amenities.length} amenities and fast wifi for remote work.`,
				type,
				spaceType,
				address: {
					street: pick(STREETS, random),
					streetNumber: String(1 + Math.floor(random() * 120)),
					city: city.city,
					postalCode: String(10000 + Math.floor(random() * 20000)),
					country: city.country
				},
				latitude: city.latitude + (random() - 0.5) * 0.06,
				longitude: city.longitude + (random() - 0.5) * 0.08,
				maxGuests,
				bedrooms,
				beds,
				bathrooms,
				pricePerNightMinor: Math.round(30 + random() * 220) * 100,
				recommendationSortKey: -ACCOMMODATION_CONFIG.recommendationBaselineAverage,
				guestRatingAverage: 0,
				guestReviewCount: 0,
				amenities,
				imageKeys: buildImageKeys(seedIndex),
				checkInStart: pick(CHECK_IN_STARTS, random),
				checkInEnd: pick(CHECK_IN_ENDS, random),
				checkOut: pick(CHECK_OUTS, random),
				minimumStay,
				smokingAllowed: random() < 0.15,
				petsAllowed: random() < 0.4,
				partiesAllowed: random() < 0.2,
				houseRules: pick(HOUSE_RULES, random),
				status: 'published',
				updatedAt: Date.now() - Math.floor(random() * 30) * 86_400_000
			};

			if (random() < 0.5) listing.maximumStay = minimumStay + 10 + Math.floor(random() * 20);

			const id = await ctx.db.insert('accommodations', listing);
			const accommodation = await ctx.db.get('accommodations', id);
			if (accommodation === null) throw new Error('Seed insert did not persist.');
			await accommodationOwnerAggregate.insert(ctx, accommodation);
		}

		return count;
	}
});

/** Dev-only: delete up to 100 seeded rows. Repeat until this returns zero. */
export const clearSeededAccommodations = internalMutation({
	args: {
		ownerId: v.optional(v.string())
	},
	returns: v.number(),
	handler: async (ctx, args) => {
		const ownerId = args.ownerId?.trim() || SEED_OWNER_ID;
		const seeded = await ctx.db
			.query('accommodations')
			.withIndex('by_owner_id', (query) => query.eq('ownerId', ownerId))
			.take(100);

		for (const accommodation of seeded) {
			await accommodationOwnerAggregate.delete(ctx, accommodation);
			await ctx.db.delete('accommodations', accommodation._id);
		}

		return seeded.length;
	}
});

/** Dev-only: attach completed bookings and published reviews to seeded accommodations. */
export const seedReviews = internalMutation({
	args: {
		ownerId: v.optional(v.string()),
		maxAccommodations: v.optional(v.number()),
		maxReviewsPerAccommodation: v.optional(v.number())
	},
	returns: v.number(),
	handler: async (ctx, args) => {
		const ownerId = args.ownerId?.trim() || SEED_OWNER_ID;
		const maxAccommodations = Math.min(Math.max(Math.floor(args.maxAccommodations ?? 200), 1), 500);
		const maxReviews = Math.min(Math.max(Math.floor(args.maxReviewsPerAccommodation ?? 8), 0), 20);
		const accommodations = await ctx.db
			.query('accommodations')
			.withIndex('by_owner_id', (query) => query.eq('ownerId', ownerId))
			.take(maxAccommodations);

		const now = Date.now();
		let inserted = 0;

		for (const [index, accommodation] of accommodations.entries()) {
			const random = createRandom(90_000 + index);
			const reviewCount = Math.floor(random() * (maxReviews + 1));

			for (let reviewIndex = 0; reviewIndex < reviewCount; reviewIndex += 1) {
				const guestIndex = Math.floor(random() * SEED_REVIEWER_NAMES.length);
				const guestOwnerId = `${SEED_GUEST_PREFIX}${guestIndex}`;
				const [firstName = 'Guest', ...rest] = pick(SEED_REVIEWER_NAMES, random).split(' ');
				const lastName = rest.join(' ') || 'Guest';
				const email = `${guestOwnerId}@example.com`;
				const stayEndOffsetDays = 10 + Math.floor(random() * 300);
				const nights = 1 + Math.floor(random() * 6);
				const checkOutDate = new Date(now - stayEndOffsetDays * 86_400_000)
					.toISOString()
					.slice(0, 10);
				const checkInDate = new Date(Date.parse(checkOutDate) - nights * 86_400_000)
					.toISOString()
					.slice(0, 10);

				const bookingId = await ctx.db.insert('bookings', {
					ownerId: guestOwnerId,
					hostId: accommodation.ownerId,
					status: 'completed',
					completedAt: now - stayEndOffsetDays * 86_400_000,
					completedBy: accommodation.ownerId,
					accommodationId: accommodation._id,
					firstName,
					lastName,
					email,
					phone: '+381600000000',
					checkInDate,
					checkOutDate,
					adults: 1 + Math.floor(random() * 3),
					children: Math.floor(random() * 2),
					searchText: `${lastName} ${email}`.toLowerCase()
				});
				const reviewId = await ctx.db.insert('reviews', {
					bookingId,
					accommodationId: accommodation._id,
					ownerId: guestOwnerId,
					authorName: firstName,
					stayMonth: checkInDate.slice(0, 7),
					rating: pick(SEED_REVIEW_RATINGS, random),
					comment: pick(SEED_REVIEW_COMMENTS, random),
					status: 'published'
				});
				await ctx.db.patch('bookings', bookingId, { reviewId });
				const review = await ctx.db.get('reviews', reviewId);
				if (review) await reviewAggregate.insert(ctx, review);
				inserted += 1;
			}
			await updateAccommodationReviewSortKeys(ctx, accommodation._id);
		}

		return inserted;
	}
});

/** Dev-only: delete seeded reviews and their bookings. Repeat until this returns zero. */
export const clearSeededReviews = internalMutation({
	args: {},
	returns: v.number(),
	handler: async (ctx) => {
		let deleted = 0;
		const affectedAccommodations = new Set<Doc<'accommodations'>['_id']>();

		for (let guestIndex = 0; guestIndex < SEED_REVIEWER_NAMES.length; guestIndex += 1) {
			const ownerId = `${SEED_GUEST_PREFIX}${guestIndex}`;
			const reviews = await ctx.db
				.query('reviews')
				.withIndex('by_owner_id', (query) => query.eq('ownerId', ownerId))
				.take(100);

			for (const review of reviews) {
				await reviewAggregate.delete(ctx, review);
				await ctx.db.delete('reviews', review._id);
				await ctx.db.delete('bookings', review.bookingId);
				affectedAccommodations.add(review.accommodationId);
				deleted += 1;
			}
		}
		for (const accommodationId of affectedAccommodations) {
			await updateAccommodationReviewSortKeys(ctx, accommodationId);
		}

		return deleted;
	}
});
