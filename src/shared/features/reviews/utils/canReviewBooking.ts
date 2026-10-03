// UTILS
import { getReviewDeadline } from './getReviewDeadline.js';

export function canReviewBooking(
	booking: {
		status: string;
		checkOutDate: string;
		cancellationTerms: { timeZone: string; checkOutAt: number };
		reviewId?: string;
		hostId?: string;
		ownerId?: string;
	},
	now: number
): boolean {
	const isOwnListing = booking.hostId !== undefined && booking.hostId === booking.ownerId;
	return (
		booking.status === 'completed' &&
		!booking.reviewId &&
		!isOwnListing &&
		now >= booking.cancellationTerms.checkOutAt &&
		now < getReviewDeadline(booking.checkOutDate, booking.cancellationTerms.timeZone)
	);
}
