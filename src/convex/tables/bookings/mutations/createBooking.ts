// LIBRARIES
import { MINUTE } from '@convex-dev/rate-limiter';
import { ConvexError, v } from 'convex/values';

// CONVEX
import { internal } from '../../../_generated/api.js';

// BUILDERS
import { mutation } from '../../../builders/convexFunctionBuilders.js';

// AGGREGATES
import { bookingOwnerAggregate } from '../aggregates/bookingOwnerAggregate.js';

// AUTH
import { getOwnerId } from '../../../betterAuth/helpers/requireIdentity.js';

// SCHEMAS
import { createBookingSchema } from '../../../../shared/features/bookings/schemas/bookingSchemas.js';
import { timeZoneSchema } from '../../../../shared/features/timezone/schemas/timezoneSchemas.js';
import { cancellationPolicySchema } from '../../../../shared/features/accommodations/schemas/cancellationPolicySchemas.js';

// CONFIG
import { COMPANY_DATA } from '../../../../shared/config.js';

// UTILS
import { getIsoDateInTimeZone } from '../../../../shared/features/timezone/utils/getIsoDateInTimeZone.js';
import { getZonedTimestamp } from '../../../../shared/features/timezone/utils/getZonedTimestamp.js';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';

/** Public booking request: guests submit their stay and contact details; no payment is taken. */
export const createBooking = mutation({
	rateLimit: {
		name: 'bookings:create',
		config: { kind: 'token bucket', rate: 10, period: MINUTE, capacity: 5 }
	},
	args: {
		accommodationId: v.id('accommodations'),
		checkInDate: v.string(),
		checkOutDate: v.string(),
		adults: v.number(),
		children: v.number(),
		firstName: v.string(),
		lastName: v.string(),
		email: v.string(),
		phone: v.string(),
		specialRequests: v.optional(v.string())
	},
	returns: v.id('bookings'),
	handler: async (ctx, args) => {
		const accommodation = await ctx.db.get('accommodations', args.accommodationId);
		if (!accommodation) {
			throw new ConvexError<BackendErrorData>({ code: 'ACCOMMODATION_NOT_FOUND' });
		}

		const timeZone = timeZoneSchema.safeParse(accommodation.timeZone);
		const policy = cancellationPolicySchema.safeParse(accommodation.cancellationPolicy);
		if (!timeZone.success || !policy.success) {
			throw new ConvexError<BackendErrorData>({ code: 'BOOKING_TERMS_UNAVAILABLE' });
		}

		const now = Date.now();

		// The client preview is not authoritative: re-check the stay against the stored listing.
		const parsed = createBookingSchema({
			today: getIsoDateInTimeZone(now, timeZone.data),
			minimumStay: accommodation.minimumStay,
			maximumStay: accommodation.maximumStay,
			maxGuests: accommodation.maxGuests
		}).safeParse(args);

		if (!parsed.success) throw new ConvexError<BackendErrorData>({ code: 'INVALID_BOOKING' });

		let checkInAt: number;
		let checkOutAt: number;

		try {
			checkInAt = getZonedTimestamp(
				parsed.data.checkInDate,
				accommodation.checkInStart,
				timeZone.data
			);
		} catch {
			throw new ConvexError<BackendErrorData>({ code: 'BOOKING_CHECK_IN_TIME_UNAVAILABLE' });
		}
		if (checkInAt <= now) throw new ConvexError<BackendErrorData>({ code: 'INVALID_BOOKING' });
		try {
			checkOutAt = getZonedTimestamp(
				parsed.data.checkOutDate,
				accommodation.checkOut,
				timeZone.data
			);
		} catch {
			throw new ConvexError<BackendErrorData>({ code: 'BOOKING_CHECK_OUT_TIME_UNAVAILABLE' });
		}

		// Signed-in guests own their booking immediately; anonymous requests stay claimable later.
		const identity = await ctx.auth.getUserIdentity();
		const ownerId = identity ? getOwnerId(identity) : undefined;

		const booking = {
			...parsed.data,
			// Keep the validator-typed id: the shared schema only knows it as a string.
			accommodationId: args.accommodationId,
			ownerId,
			// The host owns everything booked on their listing; copied now so host pages need no join scan.
			hostId: accommodation.ownerId,
			status: 'pending' as const,
			requestEmailIds: {},
			cancellationTerms: {
				policy: policy.data,
				timeZone: timeZone.data,
				checkInStart: accommodation.checkInStart,
				checkInAt,
				checkOut: accommodation.checkOut,
				checkOutAt,
				pricePerNightMinor: accommodation.pricePerNightMinor,
				currency: COMPANY_DATA.CURRENCY
			},
			searchText: `${parsed.data.lastName} ${parsed.data.email}`.toLowerCase()
		};

		const bookingId = await ctx.db.insert('bookings', booking);

		if (ownerId) {
			const stored = await ctx.db.get('bookings', bookingId);
			if (stored) await bookingOwnerAggregate.insert(ctx, stored);
		}

		const delivery =
			internal.tables.bookings.mutations.enqueueBookingRequestEmail.enqueueBookingRequestEmail;
		for (const recipient of ['guest', 'host'] as const) {
			await ctx.scheduler.runAfter(0, delivery, {
				bookingId,
				booking: {
					hostId: booking.hostId,
					email: booking.email,
					firstName: booking.firstName,
					lastName: booking.lastName,
					phone: booking.phone,
					specialRequests: booking.specialRequests,
					adults: booking.adults,
					children: booking.children,
					cancellationTerms: booking.cancellationTerms
				},
				recipient,
				accommodationName: accommodation.name
			});
		}

		return bookingId;
	}
});
