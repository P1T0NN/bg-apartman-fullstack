// LIBRARIES
import { ConvexError, v } from 'convex/values';

// AUTH
import { getOwnerId } from '../../../betterAuth/helpers/requireIdentity.js';

// HELPERS
import { getBookingAvailabilityCandidates } from '../../bookings/helpers/getBookingAvailabilityCandidates.js';

// CONFIG
import { ACCOMMODATION_CONFIG } from '../../../../shared/features/accommodations/config.js';

// UTILS
import { DAY_IN_MS, parseIsoDate } from '../../../../shared/utils/date.js';
import { getIsoDateInTimeZone } from '../../../../shared/features/timezone/utils/getIsoDateInTimeZone.js';
import { getZonedTimestamp } from '../../../../shared/features/timezone/utils/getZonedTimestamp.js';
import { calculateBookingRequestExpiry } from '../../../../shared/features/bookings/utils/calculateBookingRequestExpiry.js';

// TYPES
import type { MutationCtx } from '../../../_generated/server.js';
import type { Id } from '../../../_generated/dataModel.js';
import type { UserIdentity } from 'convex/server';
import type { BackendErrorData } from '../../../../shared/types/types.js';

export const blockedDateRangeArgs = {
	accommodationId: v.id('accommodations'),
	startDate: v.string(),
	lastDate: v.string()
};

/** Inclusive host dates. Authorize, validate, check reservations and write atomically. */
export async function updateBlockedDates(
	ctx: MutationCtx & { identity: UserIdentity },
	args: { accommodationId: Id<'accommodations'>; startDate: string; lastDate: string },
	blocked: boolean
) {
	const accommodation = await ctx.db.get('accommodations', args.accommodationId);
	if (!accommodation || accommodation.ownerId !== getOwnerId(ctx.identity))
		throw new ConvexError<BackendErrorData>({ code: 'FORBIDDEN' });
	if (accommodation.status === 'deleted')
		throw new ConvexError<BackendErrorData>({ code: 'ACCOMMODATION_NOT_FOUND' });
	const start = parseIsoDate(args.startDate);
	const last = parseIsoDate(args.lastDate);
	const count =
		start && last
			? (Date.parse(last.toString()) - Date.parse(start.toString())) / DAY_IN_MS + 1
			: 0;
	const invalid =
		!start ||
		!last ||
		count < 1 ||
		count > ACCOMMODATION_CONFIG.MAX_BLOCKED_DATES_PER_OPERATION ||
		args.startDate < getIsoDateInTimeZone(Date.now(), accommodation.timeZone);
	if (invalid || !start || !last)
		throw new ConvexError<BackendErrorData>({ code: 'INVALID_BLOCKED_DATE_RANGE' });
	const endDate = last.add({ days: 1 }).toString();
	let pendingRequests = 0;
	if (blocked) {
		let startAt: number;
		let endAt: number;
		try {
			startAt = getZonedTimestamp(
				args.startDate,
				accommodation.checkInStart,
				accommodation.timeZone
			);
			endAt = getZonedTimestamp(endDate, accommodation.checkOut, accommodation.timeZone);
		} catch {
			throw new ConvexError<BackendErrorData>({ code: 'BOOKING_TERMS_UNAVAILABLE' });
		}
		const candidates = await getBookingAvailabilityCandidates(ctx, args.accommodationId, startAt);
		const conflict = candidates.some((booking) => booking.cancellationTerms.checkInAt < endAt);
		if (conflict)
			throw new ConvexError<BackendErrorData>({ code: 'BLOCKED_DATES_BOOKING_CONFLICT' });
		const requests = await getBookingAvailabilityCandidates(
			ctx,
			args.accommodationId,
			startAt,
			'pending'
		);
		pendingRequests = requests.filter(
			(booking) =>
				booking.cancellationTerms.checkInAt < endAt &&
				Date.now() < calculateBookingRequestExpiry(booking)
		).length;
	}
	// At most 30 rows under the one-row-per-night invariant. No nonunique bulk inserts.
	for (let date = start; date.compare(last) <= 0; date = date.add({ days: 1 })) {
		const iso = date.toString();
		const existing = await ctx.db
			.query('accommodationBlockedDates')
			.withIndex('by_accommodation_id_date', (q) =>
				q.eq('accommodationId', args.accommodationId).eq('date', iso)
			)
			.unique();
		if (blocked && !existing)
			await ctx.db.insert('accommodationBlockedDates', {
				accommodationId: args.accommodationId,
				date: iso
			});
		else if (!blocked && existing) await ctx.db.delete('accommodationBlockedDates', existing._id);
	}
	return { pendingRequests };
}
