// LIBRARIES
import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const bookingRecoveryTokens = defineTable({
	tokenHash: v.string(),
	email: v.string(),
	expiresAt: v.number(),
	// Retain old records without reactivating credentials consumed by the previous flow.
	consumedAt: v.optional(v.number())
})
	.index('by_token_hash', ['tokenHash'])
	.index('by_expires_at', ['expiresAt']);
