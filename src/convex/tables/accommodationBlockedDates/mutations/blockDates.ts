// LIBRARIES
import { v } from 'convex/values';

// BUILDERS
import { authenticatedMutation } from '../../../builders/convexFunctionBuilders.js';

// HELPERS
import { blockedDateRangeArgs, updateBlockedDates } from '../helpers/updateBlockedDates.js';

export const blockDates = authenticatedMutation({
	rateLimit: { name: 'accommodations:block-dates' },
	args: blockedDateRangeArgs,
	returns: v.object({ pendingRequests: v.number() }),
	handler: (ctx, args) => updateBlockedDates(ctx, args, true)
});
