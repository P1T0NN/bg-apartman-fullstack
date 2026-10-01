// LIBRARIES
import { z } from 'zod';

export const createReviewSchema = z.object({
	bookingId: z.string().min(1),
	rating: z.coerce.number().int().min(1).max(5),
	comment: z.string().trim().min(1).max(2000)
});

export const updateReviewVisibilitySchema = z.object({
	id: z.string().min(1),
	status: z.enum(['published', 'hidden']),
	reason: z.string().trim().min(1).max(500)
});
