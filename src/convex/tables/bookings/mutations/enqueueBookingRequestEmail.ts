import { literals } from 'convex-helpers/validators';
import { v } from 'convex/values';
import { internalMutation } from '../../../_generated/server.js';
import { components } from '../../../_generated/api.js';
import { bookings } from '../schema.js';
import { sendBookingRequestEmail } from '../emails/sendBookingRequestEmail.js';

/** Persist the component email ID in the same transaction that queues the receipt. */
export const enqueueBookingRequestEmail = internalMutation({
	args: {
		bookingId: v.id('bookings'),
		booking: bookings.validator.pick(
			'hostId',
			'email',
			'firstName',
			'lastName',
			'phone',
			'specialRequests',
			'adults',
			'children',
			'cancellationTerms'
		),
		recipient: literals('guest', 'host'),
		accommodationName: v.string()
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const stored = await ctx.db.get('bookings', args.bookingId);
		if (!stored || stored.requestEmailIds?.[args.recipient]) return null;
		let email = args.booking.email;
		if (args.recipient === 'host') {
			if (!args.booking.hostId) throw new Error('Booking host account reference is unavailable');
			const host = await ctx.runQuery(components.betterAuth.queries.getUser.getUser, {
				id: args.booking.hostId
			});
			if (!host) throw new Error('Booking host account is unavailable');
			email = host.email;
		}
		const emailId = await sendBookingRequestEmail(ctx, { ...args, email });
		await ctx.db.patch('bookings', args.bookingId, {
			requestEmailIds: { ...stored.requestEmailIds, [args.recipient]: emailId }
		});
		return null;
	}
});
