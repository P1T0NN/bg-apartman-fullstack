import { z } from 'zod';

export const searchLocationSchema = z.object({
	placeId: z.string().regex(/^[A-Za-z0-9_-]{1,300}$/)
});
