import { v } from 'convex/values';
import { internalMutation } from '../../../_generated/server.js';
import { internal } from '../../../_generated/api.js';
import { completeBooking } from '../helpers/completeBooking.js';

export const completeBookingsCron = internalMutation({
	args: {},
	returns: v.number(),
	handler: async (ctx) => {
		const bookings = await ctx.db
			.query('bookings')
			.withIndex('by_status_check_out_at', (q) =>
				q.eq('status', 'confirmed').lte('cancellationTerms.checkOutAt', Date.now())
			)
			.take(25);
		for (const booking of bookings) await completeBooking(ctx, booking, 'system');
		if (bookings.length === 25) {
			await ctx.scheduler.runAfter(
				0,
				internal.tables.bookings.crons.completeBookingsCron.completeBookingsCron,
				{}
			);
		}
		return bookings.length;
	}
});
