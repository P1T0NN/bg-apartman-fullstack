// TYPES
import type { Doc } from '@/convex/betterAuth/component/_generated/dataModel';

/** Signed-in user summary supplied by the root layout (`api.auth.getCurrentUser`). */
export type AuthUserSummary = Pick<Doc<'user'>, 'name' | 'email' | 'emailVerified' | 'image'>;

/** Session row from better-auth's `listSessions`, with dates normalized to milliseconds. */
export type AuthSession = Pick<
	Doc<'session'>,
	'token' | 'createdAt' | 'updatedAt' | 'expiresAt' | 'ipAddress' | 'userAgent'
> & { id: string };

/**
 * Auth error codes — logic sets one of these; markup resolves its Paraglide message key.
 */
export type SignUpErrorCode =
	| 'PASSWORDS_DO_NOT_MATCH'
	| 'INVALID_EMAIL'
	| 'PASSWORD_TOO_SHORT'
	| 'USER_ALREADY_EXISTS'
	| 'INVALID_OTP'
	| 'OTP_EXPIRED'
	| 'TOO_MANY_ATTEMPTS'
	| 'SOMETHING_WENT_WRONG';
