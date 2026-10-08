// LIBRARIES
import { docValidator } from 'convex/server';
import { v } from 'convex/values';

// SCHEMAS
import { loyaltyMemberships } from '../schema.js';
import { loyaltyLevelValidator } from './loyaltyBenefitsValidators.js';

export const myBenefitsValidator = docValidator('loyaltyMemberships', loyaltyMemberships)
	.pick('qualifyingStays')
	.extend({
		level: loyaltyLevelValidator,
		joinedAt: v.union(v.number(), v.null())
	});
