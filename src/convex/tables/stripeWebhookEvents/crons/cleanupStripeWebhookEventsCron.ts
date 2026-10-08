// LIBRARIES
import { v } from 'convex/values';

// CONVEX
import { internalMutation } from '../../../_generated/server.js';
import { internal } from '../../../_generated/api.js';

// CONFIG
import { STRIPE_CONFIG } from '../../../../shared/features/stripe/config.js';

export const cleanupStripeWebhookEventsCron = internalMutation({
	args: {},
	returns: v.number(),
	handler: async (ctx) => {
		const events = await ctx.db
			.query('stripeWebhookEvents')
			.withIndex('by_processed_at', (q) =>
				q.lte('processedAt', Date.now() - STRIPE_CONFIG.webhookEventRetentionMs)
			)
			.take(STRIPE_CONFIG.maintenanceBatchSize);
		for (const event of events) await ctx.db.delete('stripeWebhookEvents', event._id);
		const hasMoreExpiredEvents = events.length === STRIPE_CONFIG.maintenanceBatchSize;
		if (hasMoreExpiredEvents)
			await ctx.scheduler.runAfter(
				0,
				internal.tables.stripeWebhookEvents.crons.cleanupStripeWebhookEventsCron
					.cleanupStripeWebhookEventsCron,
				{}
			);
		return events.length;
	}
});
