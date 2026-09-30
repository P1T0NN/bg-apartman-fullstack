// LIBRARIES
import { ConvexError } from 'convex/values';

// COMPONENTS
import { m } from '../lib/paraglide/messages.js';

// TYPES
import { backendErrorDataSchema } from '../shared/types/types.js';

export function getBackendErrorMessage(error: Error): string | undefined {
	if (!(error instanceof ConvexError)) return;
	const parsed = backendErrorDataSchema.safeParse(error.data);
	if (!parsed.success) return;

	switch (parsed.data.code) {
		case 'INVALID_ACCOMMODATION':
			return m['BackendMessages.invalidAccommodation']();
		case 'INVALID_BOOKING':
			return m['BackendMessages.invalidBooking']();
		case 'BOOKING_NOT_FOUND':
			return m['BackendMessages.bookingNotFound']();
		case 'INVALID_BOOKING_STATUS':
			return m['BackendMessages.invalidBookingStatus']();
		case 'ACCOMMODATION_NOT_FOUND':
			return m['BackendMessages.accommodationNotFound']();
		case 'INVALID_FEEDBACK':
			return m['BackendMessages.invalidFeedback']();
		case 'FEEDBACK_NOT_FOUND':
			return m['BackendMessages.feedbackNotFound']();
		case 'UNAUTHENTICATED':
			return m['BackendMessages.unauthenticated']();
		case 'FORBIDDEN':
			return m['BackendMessages.forbidden']();
		case 'CAPTCHA_FAILED':
			return m['BackendMessages.captchaFailed']();
		case 'INVALID_RETAINED_IMAGE':
		case 'INVALID_UPLOAD_NAMESPACE':
		case 'INVALID_UPLOAD':
			return m['BackendMessages.invalidUpload']();
		case 'DUPLICATE_RETAINED_IMAGE':
		case 'DUPLICATE_UPLOAD_KEY':
			return m['BackendMessages.duplicateUpload']();
		case 'UPLOAD_NOT_FOUND':
			return m['BackendMessages.uploadNotFound']();
		case 'TOO_MANY_FILES':
			return m['ValidationMessages.maxItems']({ maximum: parsed.data.maxFiles });
	}
}
