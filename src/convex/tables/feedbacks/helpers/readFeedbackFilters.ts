// CONFIG
import {
	FEEDBACK_CATEGORIES,
	FEEDBACK_TYPES
} from '../../../../shared/features/feedbacks/schemas/feedbackSchemas.js';

// TYPES
import type {
	FeedbackCategory,
	FeedbackType
} from '../../../../shared/features/feedbacks/schemas/feedbackSchemas.js';

export type FeedbackFilters = {
	type?: FeedbackType;
	category?: FeedbackCategory;
};

function isFeedbackType(value: string | undefined): value is FeedbackType {
	return value !== undefined && FEEDBACK_TYPES.some((type) => type === value);
}

function isFeedbackCategory(value: string | undefined): value is FeedbackCategory {
	return value !== undefined && FEEDBACK_CATEGORIES.some((category) => category === value);
}

/** Read the validated feedback filter values from the symbolic filter record. */
export function readFeedbackFilters(filters: Record<string, string> | undefined): FeedbackFilters {
	const type = filters?.type;
	const category = filters?.category;

	return {
		type: isFeedbackType(type) ? type : undefined,
		category: isFeedbackCategory(category) ? category : undefined
	};
}
