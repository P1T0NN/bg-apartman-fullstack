// SVELTEKIT IMPORTS
import { page } from '$app/state';

// LIBRARIES
import { authClient } from '../lib/authClient';

// TYPES
import type { AuthActionResult } from '../lib/runAuthAction';

// COMPONENTS
import { toast } from 'svelte-sonner';

// CONSTANTS
import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints';

// UTILS
import { gotoParaglide } from '@/utils/gotoParaglide.js';
import { toErrorCode } from '@/shared/utils/toErrorCode';

// DATA
import { AUTH_REDIRECT_PARAM, SERVER_MESSAGE_TO_CODE } from '@/shared/features/auth/data/authData';

// TYPES
import type { SignUpErrorCode } from '@/shared/features/auth/types/authTypes';

/**
 * Shared submit plumbing for the auth forms — owns `error`/`submitting` state,
 * wraps every better-auth call in the same try/finally, and maps server messages
 * to codes. Keep the returned object: destructuring the getters snapshots them.
 */
export function useAuth() {
	let error = $state<SignUpErrorCode | null>(null);
	let submitting = $state(false);

	/** Set a local (client-side) error code, e.g. the confirm-password check. */
	function setError(code: SignUpErrorCode) {
		error = code;
	}

	function setErrorFrom(message: string | undefined) {
		error = toErrorCode(message ?? '', SERVER_MESSAGE_TO_CODE, 'SOMETHING_WENT_WRONG');
	}

	function captchaFetchOptions(captchaToken: string) {
		return { fetchOptions: { headers: { 'x-captcha-response': captchaToken } } };
	}

	/**
	 * Same-origin path from `?redirectTo=`, or null when missing, external, or
	 * malformed — so a crafted link cannot turn sign-in into an open redirect.
	 */
	function redirectTarget() {
		const raw = page.url.searchParams.get(AUTH_REDIRECT_PARAM);
		if (!raw) return null;
		try {
			const target = new URL(raw, page.url.origin);
			if (target.origin !== page.url.origin) return null;
			return `${target.pathname}${target.search}${target.hash}`;
		} catch {
			return null;
		}
	}

	async function run(action: () => Promise<AuthActionResult>, onSuccess?: () => void) {
		error = null;
		submitting = true;
		try {
			const result = await action();
			if (result?.error) {
				if (result.error.code === 'BANNED_USER') {
					// eslint-disable-next-line svelte/prefer-svelte-reactivity
					const params = new URLSearchParams({ error: 'BANNED_USER' });
					if (result.error.message) params.set('error_description', result.error.message);
					await gotoParaglide(`${UNPROTECTED_PAGE_ENDPOINTS.AUTH_ERROR}?${params}`);
					return;
				}

				setErrorFrom(result.error.message);
			} else {
				// Endpoints that return a redirect url navigate themselves via the redirect
				// plugin; the OTP flows don't, so callers can pass an onSuccess (e.g. goto).
				onSuccess?.();
			}
		} finally {
			submitting = false;
		}
	}

	return {
		get error() {
			return error;
		},
		get submitting() {
			return submitting;
		},
		setError,
		signInWithEmail(email: string, password: string, captchaToken: string) {
			return run(() =>
				authClient.signIn.email({
					...captchaFetchOptions(captchaToken),
					email,
					password,
					callbackURL: redirectTarget() ?? UNPROTECTED_PAGE_ENDPOINTS.ROOT
				})
			);
		},
		// successMessage is authored by the calling .svelte (CodingRules: no text in utils).
		signUpWithEmail(
			email: string,
			password: string,
			name: string,
			successMessage: string,
			captchaToken: string
		) {
			return run(
				() =>
					authClient.signUp.email({
						...captchaFetchOptions(captchaToken),
						email,
						password,
						name
					}),
				() => {
					// Server returns the SAME success for new accounts and existing emails
					// (anti-enumeration), so both cases take this path: toast + OTP page.
					// No callbackURL on purpose — the redirect plugin does a full page reload,
					// which would drop the toast.
					toast.success(successMessage);
					const params = new URLSearchParams({ email });
					const target = redirectTarget();
					if (target) params.set(AUTH_REDIRECT_PARAM, target);
					gotoParaglide(`${UNPROTECTED_PAGE_ENDPOINTS.VERIFY_EMAIL}?${params}`);
				}
			);
		},
		sendVerificationOtp(email: string, captchaToken: string) {
			return run(() =>
				authClient.emailOtp.sendVerificationOtp({
					...captchaFetchOptions(captchaToken),
					email,
					type: 'email-verification'
				})
			);
		},
		verifyEmail(email: string, otp: string, captchaToken: string) {
			return run(
				() => authClient.emailOtp.verifyEmail({ ...captchaFetchOptions(captchaToken), email, otp }),
				() => gotoParaglide(redirectTarget() ?? UNPROTECTED_PAGE_ENDPOINTS.ROOT)
			);
		},
		requestPasswordReset(email: string, captchaToken: string) {
			return run(() =>
				authClient.emailOtp.requestPasswordReset({ ...captchaFetchOptions(captchaToken), email })
			);
		},
		resetPassword(email: string, otp: string, password: string, captchaToken: string) {
			return run(
				() =>
					authClient.emailOtp.resetPassword({
						...captchaFetchOptions(captchaToken),
						email,
						otp,
						password
					}),
				() => gotoParaglide(UNPROTECTED_PAGE_ENDPOINTS.SIGN_IN)
			);
		},
		signInWithGoogle(captchaToken: string) {
			return run(() =>
				authClient.signIn.social({
					...captchaFetchOptions(captchaToken),
					provider: 'google',
					callbackURL: redirectTarget() ?? UNPROTECTED_PAGE_ENDPOINTS.ROOT,
					errorCallbackURL: UNPROTECTED_PAGE_ENDPOINTS.AUTH_ERROR
				})
			);
		}
	};
}
