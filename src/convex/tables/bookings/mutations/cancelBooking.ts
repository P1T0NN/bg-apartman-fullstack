// LIBRARIES
import { ConvexError, v } from 'convex/values';
import { literals } from 'convex-helpers/validators';
import type { FunctionReturnType } from 'convex/server';
import { components, internal } from '../../../_generated/api.js';
import { authenticatedMutation } from '../../../builders/convexFunctionBuilders.js';

// HELPERS
import { getOwnerId } from '../../../betterAuth/helpers/requireIdentity.js';

// UTILS
import { canCancelBooking } from '../../../../shared/features/bookings/utils/canCancelBooking.js';
import { checkBookingCancellationRefund } from '../../../../shared/features/bookings/utils/checkBookingCancellationRefund.js';

// SCHEMAS
import { cancelBookingSchema } from '../../../../shared/features/bookings/schemas/bookingSchemas.js';
import { cancellationRefundPercentage } from '../schema.js';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';

/** Guest cancellation is immediate; client expectations only protect against an unreviewed change. */
export const cancelBooking = authenticatedMutation({
	rateLimit: { name: 'bookings:cancel' },
	args: {
		bookingId: v.id('bookings'),
		reason: v.string(),
		expectedStatus: literals('pending', 'confirmed'),
		expectedRefundPercentage: cancellationRefundPercentage,
		locale: v.string()
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const ownerId = getOwnerId(ctx.identity);

		const booking = await ctx.db.get('bookings', args.bookingId);
		if (!booking || booking.ownerId !== ownerId)
			throw new ConvexError<BackendErrorData>({ code: 'BOOKING_NOT_FOUND' });

		const parsed = cancelBookingSchema.safeParse(args);
		if (!parsed.success)
			throw new ConvexError<BackendErrorData>({ code: 'INVALID_BOOKING_CANCELLATION' });

		const now = Date.now();

		if (!canCancelBooking(booking, now))
			throw new ConvexError<BackendErrorData>({ code: 'BOOKING_CANCELLATION_NOT_ELIGIBLE' });

		const isWithdrawal = booking.status === 'pending';

		const refundPercentage = isWithdrawal
			? null
			: checkBookingCancellationRefund(booking.cancellationTerms, now);

		const termsChanged =
			booking.status !== args.expectedStatus || refundPercentage !== args.expectedRefundPercentage;

		if (termsChanged)
			throw new ConvexError<BackendErrorData>({ code: 'BOOKING_CANCELLATION_CHANGED' });

		const accommodation = await ctx.db.get('accommodations', booking.accommodationId);

		let host: FunctionReturnType<typeof components.betterAuth.queries.getUser.getUser> = null;

		if (booking.hostId) {
			try {
				host = await ctx.runQuery(components.betterAuth.queries.getUser.getUser, {
					id: booking.hostId
				});
			} catch {
				// Guest cancellation must still work when the host account cannot be resolved.
				console.error('Booking cancellation host notification recipient lookup failed');
			}
		}

		await ctx.db.patch('bookings', booking._id, {
			status: 'cancelled',
			cancellation: {
				actor: 'guest',
				cancelledBy: ownerId,
				cancelledAt: now,
				reason: parsed.data.reason,
				kind: isWithdrawal ? 'withdrawal' : 'cancellation',
				refundPercentage,
				emailIds: {}
			}
		});

		const delivery =
			internal.tables.bookings.mutations.enqueueBookingCancellationEmail
				.enqueueBookingCancellationEmail;

		const notification = {
			bookingId: booking._id,
			accommodationName: accommodation?.name ?? '',
			locale: args.locale
		};

		await ctx.scheduler.runAfter(0, delivery, {
			...notification,
			recipient: 'guest',
			email: booking.email
		});

		// A deleted host account must not prevent the guest from cancelling their booking.
		if (!host) return null;

		await ctx.scheduler.runAfter(0, delivery, {
			...notification,
			recipient: 'host',
			email: host.email
		});

		return null;
	}
});
