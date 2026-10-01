// CONFIG
import { REVIEWS_CONFIG } from '../config.js';

// TYPES
import type { ReviewSummary } from '../types/reviewTypes.js';

export const EMPTY_REVIEW_SUMMARY: ReviewSummary = {
	count: 0,
	average: null,
	distribution: REVIEWS_CONFIG.REVIEW_RATINGS.map(() => 0)
};
