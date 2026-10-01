// UTILS
import { getReviewDeadline } from './getReviewDeadline.js';

export function canReviewBooking(
	booking: {
		status: string;
		checkOutDate: string;
		reviewId?: string;
		hostId?: string;
		ownerId?: string;
	},
	today: string
): boolean {
	const isOwnListing = booking.hostId !== undefined && booking.hostId === booking.ownerId;
	return (
		booking.status === 'completed' &&
		!booking.reviewId &&
		!isOwnListing &&
		booking.checkOutDate <= today &&
		Date.parse(today) < getReviewDeadline(booking.checkOutDate)
	);
}
