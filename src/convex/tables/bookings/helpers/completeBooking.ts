// LIBRARIES
import { ConvexError } from 'convex/values';

// TYPES
import type { Doc } from '../../../_generated/dataModel.js';
import type { MutationCtx } from '../../../_generated/server.js';
import type { BackendErrorData } from '../../../../shared/types/types.js';

/** Callers authorize the host or support agent first; both paths enforce the same completion rules. */
export async function completeBooking(
	ctx: MutationCtx,
	booking: Doc<'bookings'>,
	actorId: string,
	reason?: string
) {
	if (booking.status !== 'confirmed')
		throw new ConvexError<BackendErrorData>({ code: 'INVALID_BOOKING_STATUS' });
	const now = Date.now();
	const isPrematureCompletion = booking.checkOutDate > new Date(now).toISOString().slice(0, 10);
	if (isPrematureCompletion)
		throw new ConvexError<BackendErrorData>({ code: 'BOOKING_NOT_FINISHED' });
	await ctx.db.patch('bookings', booking._id, {
		status: 'completed',
		completedAt: now,
		completedBy: actorId,
		completionNote: reason
	});
}
