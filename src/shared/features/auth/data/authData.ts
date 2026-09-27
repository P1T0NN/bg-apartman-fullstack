// TYPES
import type { SignUpErrorCode } from '../types/authTypes';

export type BanDuration = 'indefinite' | 'one-day' | 'seven-days' | 'thirty-days';

export const banDurations = [
	{ value: 'indefinite', labelKey: 'AuthFeature.AuthData.indefinitely' },
	{ value: 'one-day', labelKey: 'AuthFeature.AuthData.oneDay' },
	{ value: 'seven-days', labelKey: 'AuthFeature.AuthData.sevenDays' },
	{ value: 'thirty-days', labelKey: 'AuthFeature.AuthData.thirtyDays' }
] as const satisfies readonly { value: BanDuration; labelKey: string }[];

/**
 * URL contract for the auth dialog: `?auth=sign-in|sign-up` opens it on arrival,
 * and `?redirectTo=` is the same-origin path to resume after authentication.
 */
export const AUTH_VIEW_PARAM = 'auth';
export const AUTH_REDIRECT_PARAM = 'redirectTo';

/**
 * Shared auth error vocabulary.
 * Logic sets a code; markup resolves the corresponding Paraglide message key.
 */

export const ERROR_MESSAGE_KEYS = {
	PASSWORDS_DO_NOT_MATCH: 'ValidationMessages.passwordsDoNotMatch',
	INVALID_EMAIL: 'ValidationMessages.invalidEmail',
	USER_ALREADY_EXISTS: 'ValidationMessages.userAlreadyExists',
	INVALID_OTP: 'ValidationMessages.invalidOtp',
	OTP_EXPIRED: 'ValidationMessages.otpExpired',
	TOO_MANY_ATTEMPTS: 'ValidationMessages.tooManyAttempts',
	SOMETHING_WENT_WRONG: 'ErrorMessages.unexpected'
} as const satisfies Record<Exclude<SignUpErrorCode, 'PASSWORD_TOO_SHORT'>, string>;

// better-auth returns human-readable messages, not codes — map the known ones.
// ponytail: keyed by message string; unknown messages fall through to SOMETHING_WENT_WRONG.
export const SERVER_MESSAGE_TO_CODE = {
	'Invalid email': 'INVALID_EMAIL',
	'Password too short': 'PASSWORD_TOO_SHORT',
	'User already exists. Use another email.': 'USER_ALREADY_EXISTS',
	'Invalid OTP': 'INVALID_OTP',
	'OTP expired': 'OTP_EXPIRED',
	'Too many attempts': 'TOO_MANY_ATTEMPTS',
	'Too many requests. Please try again later.': 'TOO_MANY_ATTEMPTS'
} satisfies Record<string, SignUpErrorCode>;
