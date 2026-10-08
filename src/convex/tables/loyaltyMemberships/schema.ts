// LIBRARIES
import { defineTable } from 'convex/server';
import { v } from 'convex/values';
import { loyaltyLevelValidator } from './validators/loyaltyBenefitsValidators.js';

export const loyaltyMemberships = defineTable({
	ownerId: v.string(),
	qualifyingStays: v.number(),
	// Explicitly assigned; stay thresholds are not yet approved.
	level: v.optional(loyaltyLevelValidator),
	joinedAt: v.number()
}).index('by_owner_id', ['ownerId']);
