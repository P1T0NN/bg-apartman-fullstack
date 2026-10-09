// LIBRARIES
import { defineTable } from 'convex/server';
import { v } from 'convex/values';
import { loyaltyLevelValidator } from './validators/loyaltyBenefitsValidators.js';

export const loyaltyMemberships = defineTable({
	ownerId: v.string(),
	qualifyingStays: v.number(),
	level: loyaltyLevelValidator,
	joinedAt: v.union(v.number(), v.null())
}).index('by_owner_id', ['ownerId']);
