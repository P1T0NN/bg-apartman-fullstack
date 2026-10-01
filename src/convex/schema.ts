// LIBRARIES
import { literals } from 'convex-helpers/validators';
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

// SCHEMAS
import { accommodations } from './tables/accommodations/schema.js';
import { bookings } from './tables/bookings/schema.js';
import { bookingRecoveryTokens } from './tables/bookingRecoveryTokens/schema.js';
import { bookingRecoverySessions } from './tables/bookingRecoverySessions/schema.js';
import { favorites } from './tables/favorites/schema.js';
import { feedbacks } from './tables/feedbacks/schema.js';
import { reviews } from './tables/reviews/schema.js';

export const tables = {
	accommodations,
	bookings,
	bookingRecoveryTokens,
	bookingRecoverySessions,
	favorites,
	feedbacks,
	reviews,
	newsletters: defineTable({
		/** Normalized (trimmed, lowercased) subscriber email. */
		email: v.string(),
		status: literals('subscribed', 'unsubscribed'),
		subscribedAt: v.number(),
		unsubscribedAt: v.optional(v.number())
	})
		.searchIndex('search_email', { searchField: 'email' })
		.index('by_email', ['email']),
	storageUploads: defineTable({
		ownerId: v.string(),
		key: v.string(),
		expectedSize: v.optional(v.number()),
		expectedContentType: v.optional(v.string()),
		status: literals('pending', 'uploaded'),
		createdAt: v.number()
	})
		.index('by_key', ['key'])
		.index('by_owner_id_created_at', ['ownerId', 'createdAt'])
		.index('by_created_at', ['createdAt'])
};

export default defineSchema(tables);
