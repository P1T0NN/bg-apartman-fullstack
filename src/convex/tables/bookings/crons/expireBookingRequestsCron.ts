// LIBRARIES
import { v } from 'convex/values';
import { internalMutation } from '../../../_generated/server.js';
import { internal } from '../../../_generated/api.js';

// CONFIG
import { BOOKINGS_CONFIG } from '../../../../shared/features/bookings/config.js';

// UTILS
import { calculateBookingRequestExpiry } from '../../../../shared/features/bookings/utils/calculateBookingRequestExpiry.js';

// EMAILS
import { sendBookingExpirationEmail } from '../emails/sendBookingExpirationEmail.js';

/** Expiration and the guest notification commit together; the component owns delivery retries. */
export const expireBookingRequestsCron = internalMutation({
	args: {},
	returns: v.number(),
	handler: async (ctx) => {
		const now = Date.now();

		const batchSize = BOOKINGS_CONFIG.REQUEST_EXPIRATION_BATCH_SIZE;

		const legacy = await ctx.db
			.query('bookings')
			.withIndex('by_status_request_expires_at', (q) =>
				q.eq('status', 'pending').eq('requestExpiresAt', undefined)
			)
			.take(batchSize);

		for (const booking of legacy) {
			await ctx.db.patch('bookings', booking._id, {
				requestExpiresAt: calculateBookingRequestExpiry(booking)
			});
		}

		const due = await ctx.db
			.query('bookings')
			.withIndex('by_status_request_expires_at', (q) =>
				q.eq('status', 'pending').gte('requestExpiresAt', 0).lte('requestExpiresAt', now)
			)
			.take(batchSize);

		for (const booking of due) {
			const accommodation = await ctx.db.get('accommodations', booking.accommodationId);

			await sendBookingExpirationEmail(ctx, {
				bookingId: booking._id,
				booking,
				accommodationName: accommodation?.name ?? ''
			});

			await ctx.db.patch('bookings', booking._id, {
				status: 'expired',
				expiredAt: now
			});
		}

		const hasMore = legacy.length === batchSize || due.length === batchSize;

		if (hasMore) {
			await ctx.scheduler.runAfter(
				0,
				internal.tables.bookings.crons.expireBookingRequestsCron.expireBookingRequestsCron,
				{}
			);
		}

		return due.length;
	}
});
