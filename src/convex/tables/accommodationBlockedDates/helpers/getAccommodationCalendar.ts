// LIBRARIES
import { ConvexError } from 'convex/values';

// HELPERS
import { getBookingAvailabilityCandidates } from '../../bookings/helpers/getBookingAvailabilityCandidates.js';

// UTILS
import { parseIsoDate } from '../../../../shared/utils/date.js';
import { getIsoDateInTimeZone } from '../../../../shared/features/timezone/utils/getIsoDateInTimeZone.js';

// CONFIG
import { BOOKINGS_CONFIG } from '../../../../shared/features/bookings/config.js';

// TYPES
import type { QueryCtx } from '../../../_generated/server.js';
import type { Doc } from '../../../_generated/dataModel.js';
import type { BackendErrorData } from '../../../../shared/types/types.js';

/** Public-safe unavailable dates only: manual blocks and confirmed stays from the property's today on. */
export async function getAccommodationCalendar(
	ctx: QueryCtx,
	accommodation: Doc<'accommodations'>
) {
	const now = Date.now();
	const today = getIsoDateInTimeZone(now, accommodation.timeZone);

	const [blocks, candidates] = await Promise.all([
		ctx.db
			.query('accommodationBlockedDates')
			.withIndex('by_accommodation_id_date', (q) =>
				q.eq('accommodationId', accommodation._id).gte('date', today)
			)
			.take(BOOKINGS_CONFIG.AVAILABILITY_CHECK_LIMIT + 1),

		getBookingAvailabilityCandidates(ctx, accommodation._id, now)
	]);

	// Never return a truncated set as complete availability.
	if (blocks.length > BOOKINGS_CONFIG.AVAILABILITY_CHECK_LIMIT) {
		throw new ConvexError<BackendErrorData>({ code: 'BOOKING_AVAILABILITY_UNAVAILABLE' });
	}

	const bookings = candidates.map((booking) => {
		// Preserve legacy daytime occupancy as one unavailable calendar date.
		const checkOutDate =
			booking.checkOutDate > booking.checkInDate
				? booking.checkOutDate
				: parseIsoDate(booking.checkInDate)?.add({ days: 1 }).toString();
		if (!checkOutDate)
			throw new ConvexError<BackendErrorData>({ code: 'BOOKING_TERMS_UNAVAILABLE' });
		return { checkInDate: booking.checkInDate, checkOutDate };
	});

	return {
		blockedDates: blocks.map((block) => block.date),
		bookings
	};
}
