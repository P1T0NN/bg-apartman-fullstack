// LIBRARIES
import { literals } from 'convex-helpers/validators';
import { ConvexError, v } from 'convex/values';

// BUILDERS
import { adminMutation } from '../../../builders/convexFunctionBuilders.js';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';

/** Admin triage: mark a feedback resolved, or flip it back to unresolved. */
export const updateFeedbackStatus = adminMutation({
	rateLimit: { name: 'feedbacks:update-status' },
	args: {
		id: v.id('feedbacks'),
		status: literals('unresolved', 'resolved')
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const feedback = await ctx.db.get(args.id);
		if (!feedback) throw new ConvexError<BackendErrorData>({ code: 'FEEDBACK_NOT_FOUND' });

		await ctx.db.patch(args.id, {
			status: args.status,
			resolvedAt: args.status === 'resolved' ? Date.now() : undefined
		});
		return null;
	}
});
