// LIBRARIES
import { ConvexError } from 'convex/values';

// CONFIG
import { BOOKINGS_CONFIG } from '../../../../shared/features/bookings/config.js';

// TYPES
import type { QueryCtx } from '../../../_generated/server.js';
import type { Doc, Id } from '../../../_generated/dataModel.js';
import type { BackendErrorData } from '../../../../shared/types/types.js';

/** Never return a truncated set as complete availability. Also works inside mutations. */
export async function getBookingAvailabilityCandidates(
	ctx: Pick<QueryCtx, 'db'>,
	accommodationId: Id<'accommodations'>,
	startAt: number,
	status: Doc<'bookings'>['status'] = 'confirmed'
) {
	const candidates = await ctx.db
		.query('bookings')
		.withIndex('by_accommodation_id_status_check_out_at', (q) =>
			q
				.eq('accommodationId', accommodationId)
				.eq('status', status)
				.gt('cancellationTerms.checkOutAt', startAt)
		)
		.take(BOOKINGS_CONFIG.AVAILABILITY_CHECK_LIMIT + 1);

	if (candidates.length > BOOKINGS_CONFIG.AVAILABILITY_CHECK_LIMIT) {
		throw new ConvexError<BackendErrorData>({ code: 'BOOKING_AVAILABILITY_UNAVAILABLE' });
	}
	
	return candidates;
}
