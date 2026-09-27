// LIBRARIES
import { z } from 'zod';

const MAX_EMAIL_LENGTH = 320;

export const subscribeToNewsletterSchema = z.object({
	email: z.string().trim().toLowerCase().email().max(MAX_EMAIL_LENGTH)
});
