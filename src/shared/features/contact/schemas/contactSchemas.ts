// LIBRARIES
import { z } from 'zod';

export const sendContactFormSchema = z.object({
	name: z.string().trim().min(1).max(120),
	company: z.preprocess(
		(value) => (value === '' ? undefined : value),
		z.string().trim().max(120).optional()
	),
	email: z.string().trim().pipe(z.email().max(320)),
	message: z.string().trim().min(10).max(2000)
});
