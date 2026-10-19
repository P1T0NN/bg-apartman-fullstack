// LIBRARIES
import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const checkoutWebhookEvents = defineTable({
	eventId: v.string(),
	expiresAt: v.number()
})
	.index('by_event_id', ['eventId'])
	.index('by_expires_at', ['expiresAt']);
