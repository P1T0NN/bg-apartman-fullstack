// LIBRARIES
import { MINUTE } from '@convex-dev/rate-limiter';
import { ConvexError, v } from 'convex/values';

// BUILDERS
import { mutation } from '../../../builders/convexFunctionBuilders.js';

// AGGREGATES
import { bookingOwnerAggregate } from '../aggregates/bookingOwnerAggregate.js';

// AUTH
import { getOwnerId } from '../../../betterAuth/helpers/requireIdentity.js';

// SCHEMAS
import { createBookingSchema } from '../../../../shared/features/bookings/schemas/bookingSchemas.js';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';

/** Public booking request: guests submit their stay and contact details; no payment is taken. */
export const createBooking = mutation({
	rateLimit: {
		name: 'bookings:create',
		scope: 'global',
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
		const accommodation = await ctx.db.get(args.accommodationId);
		if (!accommodation) {
			throw new ConvexError<BackendErrorData>({ code: 'ACCOMMODATION_NOT_FOUND' });
		}

		// The client preview is not authoritative: re-check the stay against the stored listing.
		const parsed = createBookingSchema({
			today: new Date().toISOString().slice(0, 10),
			minimumStay: accommodation.minimumStay,
			maximumStay: accommodation.maximumStay,
			maxGuests: accommodation.maxGuests
		}).safeParse(args);
		if (!parsed.success) throw new ConvexError<BackendErrorData>({ code: 'INVALID_BOOKING' });

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
			searchText: `${parsed.data.lastName} ${parsed.data.email}`.toLowerCase()
		};

		const bookingId = await ctx.db.insert('bookings', booking);

		if (ownerId) {
			const stored = await ctx.db.get(bookingId);
			if (stored) await bookingOwnerAggregate.insert(ctx, stored);
		}

		return bookingId;
	}
});
