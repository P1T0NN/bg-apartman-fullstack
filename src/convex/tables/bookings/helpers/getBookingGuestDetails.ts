// LIBRARIES
import { ConvexError } from 'convex/values';

// TYPES
import type { QueryCtx } from '../../../_generated/server.js';
import type { Doc } from '../../../_generated/dataModel.js';
import type { BackendErrorData } from '../../../../shared/types/types.js';

export async function getBookingGuestDetails(ctx: QueryCtx, booking: Doc<'bookings'>) {
	const accommodation = await ctx.db.get('accommodations', booking.accommodationId);
	if (!accommodation) throw new ConvexError<BackendErrorData>({ code: 'ACCOMMODATION_NOT_FOUND' });

	return {
		_id: booking._id,
		accommodationId: booking.accommodationId,
		accommodationName: accommodation.name,
		isClaimable: booking.ownerId === undefined,
		status: booking.status,
		paymentMethod: booking.paymentMethod,
		cancellationTerms: booking.cancellationTerms,
		firstName: booking.firstName,
		lastName: booking.lastName,
		email: booking.email,
		phone: booking.phone,
		specialRequests: booking.specialRequests,
		checkInDate: booking.checkInDate,
		checkOutDate: booking.checkOutDate,
		adults: booking.adults,
		children: booking.children
	};
}
