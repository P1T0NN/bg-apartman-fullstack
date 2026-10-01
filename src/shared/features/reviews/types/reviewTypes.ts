// TYPES
import type { Doc } from '@convex/_generated/dataModel';

export type Review = Pick<
	Doc<'reviews'>,
	'_id' | '_creationTime' | 'authorName' | 'stayMonth' | 'rating' | 'comment'
>;

export type MyReview = Review &
	Pick<Doc<'reviews'>, 'bookingId' | 'accommodationId' | 'status'> & {
		accommodationName: Doc<'accommodations'>['name'] | null;
		checkInDate: Doc<'bookings'>['checkInDate'] | null;
		checkOutDate: Doc<'bookings'>['checkOutDate'] | null;
	};

export type ReviewSummary = {
	count: number;
	average: number | null;
	distribution: number[];
};
