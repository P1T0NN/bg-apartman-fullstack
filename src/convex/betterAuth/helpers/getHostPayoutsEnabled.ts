// CONVEX
import { components } from '../../_generated/api.js';

// TYPES
import type { QueryCtx } from '../../_generated/server.js';

/** One account-level readiness value applies to every listing owned by the host. */
export async function getHostPayoutsEnabled(ctx: Pick<QueryCtx, 'runQuery'>, ownerId: string) {
	const user = await ctx.runQuery(components.betterAuth.queries.fetchUser.fetchUser, {
		id: ownerId
	});
	return user?.payoutsEnabled === true;
}
