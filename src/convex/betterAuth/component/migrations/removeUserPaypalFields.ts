// LIBRARIES
import { v } from 'convex/values';
import { paginator } from 'convex-helpers/server/pagination';

// CONVEX
import { internalMutation } from '../_generated/server.js';

// SCHEMA
import schema from '../schema.js';

export const removeUserPaypalFields = internalMutation({
	args: { cursor: v.union(v.null(), v.string()) },
	returns: v.object({
		processed: v.number(),
		migrated: v.number(),
		nextCursor: v.union(v.null(), v.string())
	}),
	handler: async (ctx, args) => {
		const page = await paginator(ctx.db, schema)
			.query('user')
			.paginate({ numItems: 100, cursor: args.cursor });
		let migrated = 0;

		for (const user of page.page) {
			const hasPaypalFields =
				'paypalEnvironment' in user ||
				'paypalMerchantId' in user ||
				'paypalTrackingId' in user ||
				'paypalWebhookAt' in user;
			if (!hasPaypalFields) continue;

			// Keep this historical migration runnable after the schema has been tightened.
			const patch = {
				updatedAt: user.updatedAt,
				paypalEnvironment: undefined,
				paypalMerchantId: undefined,
				paypalTrackingId: undefined,
				paypalWebhookAt: undefined
			};
			await ctx.db.patch('user', user._id, patch);
			migrated += 1;
		}

		return {
			processed: page.page.length,
			migrated,
			nextCursor: page.isDone ? null : page.continueCursor
		};
	}
});
