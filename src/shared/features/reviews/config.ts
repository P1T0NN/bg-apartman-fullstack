export const REVIEWS_CONFIG = {
	REVIEW_WINDOW_DAYS: 90,
	REVIEW_RATINGS: [5, 4, 3, 2, 1] as const,
	/** Hide an average until this many published reviews exist; one review is not a score. */
	MIN_RATING_REVIEWS: 3
};
