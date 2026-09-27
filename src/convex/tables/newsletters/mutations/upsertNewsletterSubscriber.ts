// LIBRARIES
import { ConvexError, v } from 'convex/values';

// BUILDERS
import { internalMutation } from '../../../builders/convexFunctionBuilders.js';

// AGGREGATES
import { newsletterAggregate } from '../aggregates/newsletterAggregate.js';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';

/** Idempotent subscriber upsert: re-subscribing flips the row back to `subscribed`. */
export const upsertNewsletterSubscriber = internalMutation({
	args: { email: v.string() },
	returns: v.null(),
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query('newsletters')
			.withIndex('by_email', (query) => query.eq('email', args.email))
			.unique();

		if (existing) {
			await ctx.db.patch(existing._id, {
				status: 'subscribed',
				subscribedAt: Date.now(),
				unsubscribedAt: undefined
			});
			return null;
		}

		const id = await ctx.db.insert('newsletters', {
			email: args.email,
			status: 'subscribed',
			subscribedAt: Date.now()
		});
		const subscriber = await ctx.db.get(id);
		if (!subscriber) throw new ConvexError<BackendErrorData>({ code: 'FORBIDDEN' });
		await newsletterAggregate.insert(ctx, subscriber);
		return null;
	}
});
