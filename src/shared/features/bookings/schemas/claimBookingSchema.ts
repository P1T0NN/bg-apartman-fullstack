// LIBRARIES
import { z } from 'zod';
// SCHEMAS
import { bookingRecoverySecretSchema } from '../../bookingsRecoveryTokens/schemas/bookingRecoveryTokenSchemas.js';

export const claimBookingSchema = z.object({
	bookingId: z.string().trim().min(1),
	token: bookingRecoverySecretSchema
});
