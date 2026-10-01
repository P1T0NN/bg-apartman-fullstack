// LIBRARIES
import { z } from 'zod';

export type typesBackendResult<Code extends string = string> =
	{ success: true } | { success: false; code: Code };

export const backendErrorDataSchema = z.discriminatedUnion('code', [
	z.object({ code: z.literal('INVALID_ACCOMMODATION') }),
	z.object({ code: z.literal('INVALID_BOOKING') }),
	z.object({ code: z.literal('INVALID_BOOKING_RECOVERY_REQUEST') }),
	z.object({ code: z.literal('INVALID_BOOKING_RECOVERY_TOKEN') }),
	z.object({ code: z.literal('BOOKING_EMAIL_UNVERIFIED') }),
	z.object({ code: z.literal('BOOKING_EMAIL_MISMATCH') }),
	z.object({ code: z.literal('BOOKING_ALREADY_CLAIMED') }),
	z.object({ code: z.literal('BOOKING_NOT_FOUND') }),
	z.object({ code: z.literal('INVALID_BOOKING_STATUS') }),
	z.object({ code: z.literal('BOOKING_NOT_FINISHED') }),
	z.object({ code: z.literal('INVALID_REVIEW') }),
	z.object({ code: z.literal('REVIEW_ALREADY_EXISTS') }),
	z.object({ code: z.literal('REVIEW_NOT_ELIGIBLE') }),
	z.object({ code: z.literal('REVIEW_NOT_FOUND') }),
	z.object({ code: z.literal('ACCOMMODATION_NOT_FOUND') }),
	z.object({ code: z.literal('INVALID_FEEDBACK') }),
	z.object({ code: z.literal('FEEDBACK_NOT_FOUND') }),
	z.object({ code: z.literal('UNAUTHENTICATED') }),
	z.object({ code: z.literal('FORBIDDEN') }),
	z.object({ code: z.literal('CAPTCHA_FAILED') }),
	z.object({ code: z.literal('INVALID_RETAINED_IMAGE') }),
	z.object({ code: z.literal('DUPLICATE_RETAINED_IMAGE') }),
	z.object({ code: z.literal('DUPLICATE_UPLOAD_KEY') }),
	z.object({ code: z.literal('UPLOAD_NOT_FOUND') }),
	z.object({ code: z.literal('INVALID_UPLOAD_NAMESPACE') }),
	z.object({ code: z.literal('INVALID_UPLOAD') }),
	z.object({ code: z.literal('TOO_MANY_FILES'), maxFiles: z.number() })
]);

export type BackendErrorData = z.infer<typeof backendErrorDataSchema>;
