// LIBRARIES
import { ConvexError } from 'convex/values';

// CONFIG
import { getBookingAvailabilityCandidates } from './getBookingAvailabilityCandidates.js';
import { parseIsoDate } from '../../../../shared/utils/date.js';

// TYPES
import type { MutationCtx } from '../../../_generated/server.js';
import type { Doc } from '../../../_generated/dataModel.js';
import type { BackendErrorData } from '../../../../shared/types/types.js';

/** Read and confirm in one transaction so concurrent reservations retry against committed stays. */
export async function checkBookingAvailability(
	ctx: MutationCtx,
	stay: Pick<
		Doc<'bookings'>,
		'accommodationId' | 'cancellationTerms' | 'checkInDate' | 'checkOutDate'
	>
) {
	const endDate =
		stay.checkOutDate > stay.checkInDate
			? stay.checkOutDate
			: parseIsoDate(stay.checkInDate)?.add({ days: 1 }).toString();
	if (!endDate) throw new ConvexError<BackendErrorData>({ code: 'BOOKING_TERMS_UNAVAILABLE' });
	const block = await ctx.db
		.query('accommodationBlockedDates')
		.withIndex('by_accommodation_id_date', (q) =>
			q
				.eq('accommodationId', stay.accommodationId)
				.gte('date', stay.checkInDate)
				.lt('date', endDate)
		)
		.first();
	if (block) throw new ConvexError<BackendErrorData>({ code: 'BOOKING_DATES_UNAVAILABLE' });
	const candidates = await getBookingAvailabilityCandidates(
		ctx,
		stay.accommodationId,
		stay.cancellationTerms.checkInAt
	);

	const overlaps = candidates.some(
		(booking) => booking.cancellationTerms.checkInAt < stay.cancellationTerms.checkOutAt
	);

	if (overlaps) throw new ConvexError<BackendErrorData>({ code: 'BOOKING_DATES_UNAVAILABLE' });
}
