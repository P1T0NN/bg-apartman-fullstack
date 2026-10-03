// HELPERS
import { sendOtpEmail } from '../helpers/sendOtpEmail.js';

// TYPES
import type { OtpEmailData } from '../../emails/types/emailTypes.js';

export function sendVerificationOTPEmail(
	ctx: Parameters<typeof sendOtpEmail>[0],
	data: OtpEmailData
): Promise<void> {
	return sendOtpEmail(ctx, data);
}
