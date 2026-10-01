// TYPES
import type { Doc } from '../../../_generated/dataModel.js';
import type { QueryCtx } from '../../../_generated/server.js';

/** Resolve receipt context without exposing account or moderation details. */
export async function enrichMyReview(ctx: QueryCtx, review: Doc<'reviews'>) {
	const [accommodation, booking] = await Promise.all([
		ctx.db.get('accommodations', review.accommodationId),
		ctx.db.get('bookings', review.bookingId)
	]);

	return {
		_id: review._id,
		_creationTime: review._creationTime,
		authorName: review.authorName,
		stayMonth: review.stayMonth,
		rating: review.rating,
		comment: review.comment,
		bookingId: review.bookingId,
		accommodationId: review.accommodationId,
		status: review.status,
		accommodationName: accommodation?.status === 'published' ? accommodation.name : null,
		checkInDate: booking?.checkInDate ?? null,
		checkOutDate: booking?.checkOutDate ?? null
	};
}
