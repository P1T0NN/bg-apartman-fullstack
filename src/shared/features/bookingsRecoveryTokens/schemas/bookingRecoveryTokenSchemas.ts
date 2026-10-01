// LIBRARIES
import { z } from 'zod';

// SCHEMAS
import { bookingEmailSchema } from '../../bookings/schemas/bookingSchemas.js';

/** 32 cryptographically random bytes, encoded as lowercase hex. */
export const bookingRecoverySecretSchema = z.string().regex(/^[a-f0-9]{64}$/);

export const requestBookingRecoveryLinkSchema = z.object({
	email: bookingEmailSchema,
	locale: z.string().trim().min(1).max(35)
});
