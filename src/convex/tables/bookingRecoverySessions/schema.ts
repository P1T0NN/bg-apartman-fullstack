// LIBRARIES
import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const bookingRecoverySessions = defineTable({
	secretHash: v.string(),
	email: v.string(),
	expiresAt: v.number()
}).index('by_secret_hash', ['secretHash']);
