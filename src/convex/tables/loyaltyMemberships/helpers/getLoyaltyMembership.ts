// TYPES
import type { QueryCtx } from '../../../_generated/server.js';

export function getLoyaltyMembership(ctx: Pick<QueryCtx, 'db'>, ownerId: string) {
	return ctx.db
		.query('loyaltyMemberships')
		.withIndex('by_owner_id', (q) => q.eq('ownerId', ownerId))
		.unique();
}
