import { literals } from 'convex-helpers/validators';
import { v } from 'convex/values';
import { internalMutation } from '../../../_generated/server.js';
import { sendBookingCancellationEmail } from '../emails/sendBookingCancellationEmail.js';

/** The component owns sending and retries; bookings retain only the email reference. */
export const enqueueBookingCancellationEmail = internalMutation({
	args: {
		bookingId: v.id('bookings'),
		recipient: literals('guest', 'host'),
		email: v.string(),
		accommodationName: v.string(),
		locale: v.string()
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const booking = await ctx.db.get('bookings', args.bookingId);
		if (!booking?.cancellation || booking.cancellation.emailIds?.[args.recipient]) return null;
		const emailId = await sendBookingCancellationEmail(ctx, {
			...args,
			booking: { ...booking, cancellation: booking.cancellation }
		});
		await ctx.db.patch('bookings', args.bookingId, {
			cancellation: {
				...booking.cancellation,
				emailIds: { ...booking.cancellation.emailIds, [args.recipient]: emailId }
			}
		});
		return null;
	}
});
