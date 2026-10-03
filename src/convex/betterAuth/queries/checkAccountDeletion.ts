// LIBRARIES
import { v } from 'convex/values';

// CONVEX
import { internalQuery } from '../../_generated/server.js';

// HELPERS
import { checkAccountDeletionRestrictions } from '../helpers/checkAccountDeletionRestrictions.js';

export const checkAccountDeletion = internalQuery({
	args: { id: v.string(), email: v.string() },
	returns: v.union(
		v.null(),
		v.literal('ACCOUNT_HAS_ACTIVE_BOOKINGS'),
		v.literal('ACCOUNT_HAS_ACCOMMODATIONS')
	),
	handler: (ctx, user) => checkAccountDeletionRestrictions(ctx, user)
});
