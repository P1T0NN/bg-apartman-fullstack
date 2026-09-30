import { v } from 'convex/values';
import { authenticatedQuery } from '../../../builders/convexFunctionBuilders.js';
import { getOwnerId } from '../../../betterAuth/helpers/requireIdentity.js';

export const hasPendingHostBookings = authenticatedQuery({
	args: {},
	returns: v.boolean(),
	handler: async (ctx) => {
		const bookings = await ctx.db
			.query('bookings')
			.withIndex('by_host_id_status', (q) =>
				q.eq('hostId', getOwnerId(ctx.identity)).eq('status', 'pending')
			)
			.take(1);
		return bookings.length > 0;
	}
});
