// LIBRARIES
import { MINUTE } from '@convex-dev/rate-limiter';
import { literals } from 'convex-helpers/validators';
import { ConvexError, v } from 'convex/values';

// BUILDERS
import { mutation } from '../../../builders/convexFunctionBuilders.js';

// AGGREGATES
import { feedbackAggregate } from '../aggregates/feedbackAggregate.js';

// SCHEMAS
import {
	createFeedbackSchema,
	FEEDBACK_CATEGORIES,
	FEEDBACK_TYPES
} from '../../../../shared/features/feedbacks/schemas/feedbackSchemas.js';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';

/** Public feedback inbox: guests may submit; signed-in users are attributed automatically. */
export const createFeedback = mutation({
	rateLimit: {
		name: 'feedbacks:create',
		config: { kind: 'token bucket', rate: 30, period: MINUTE, capacity: 10 }
	},
	args: {
		type: literals(...FEEDBACK_TYPES),
		category: literals(...FEEDBACK_CATEGORIES),
		title: v.string(),
		message: v.string(),
		email: v.optional(v.string())
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const parsed = createFeedbackSchema.safeParse(args);
		if (!parsed.success) throw new ConvexError<BackendErrorData>({ code: 'INVALID_FEEDBACK' });

		// Derived server-side: the client never sends its own user id.
		const identity = await ctx.auth.getUserIdentity();
		const submission = {
			...parsed.data,
			status: 'unresolved' as const,
			searchText: `${parsed.data.title} ${parsed.data.message}`.toLowerCase()
		};
		const id = await ctx.db.insert(
			'feedbacks',
			identity
				? {
						...submission,
						userId: identity.subject,
						userName: identity.name,
						userEmail: identity.email
					}
				: submission
		);
		const feedback = await ctx.db.get('feedbacks', id);
		if (!feedback) throw new ConvexError<BackendErrorData>({ code: 'FORBIDDEN' });
		await feedbackAggregate.insert(ctx, feedback);
		return null;
	}
});
