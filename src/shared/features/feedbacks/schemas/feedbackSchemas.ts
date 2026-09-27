// LIBRARIES
import { z } from 'zod';

export const FEEDBACK_TYPES = ['bug', 'question'] as const;
export const FEEDBACK_CATEGORIES = [
	'booking',
	'payment',
	'account',
	'accommodation',
	'other'
] as const;

export const createFeedbackSchema = z.object({
	type: z.enum(FEEDBACK_TYPES),
	category: z.enum(FEEDBACK_CATEGORIES),
	title: z.string().trim().min(3).max(120),
	message: z.string().trim().min(10).max(2000),
	email: z.preprocess(
		(value) => (value === '' ? undefined : value),
		z.string().trim().email().max(320).optional()
	)
});

export type FeedbackType = (typeof FEEDBACK_TYPES)[number];
export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];
