// LIBRARIES
import { v } from 'convex/values';

// CONVEX
import { internalMutation } from './_generated/server.js';

// AGGREGATES
import { accommodationOwnerAggregate } from './tables/accommodations/aggregates/accommodationOwnerAggregate.js';

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
			const accommodation = await ctx.db.get(id);
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
			await ctx.db.delete(accommodation._id);
		}

		return seeded.length;
	}
});
