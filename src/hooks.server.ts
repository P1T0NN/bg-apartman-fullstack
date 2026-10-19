// SVELTEKIT IMPORTS
import { dev } from '$app/environment';
import { sequence } from '@sveltejs/kit/hooks';

// LIBRARIES
import { withServerConvexToken } from 'convex-svelte/sveltekit/server';
import { getToken } from '@mmailaender/convex-better-auth-svelte/sveltekit';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { getTextDirection } from '$lib/paraglide/runtime';

// TYPES
import type { HandleServerError, HandleValidationError } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit';

const securityHandle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	// Auth proxies and redirects may return immutable headers; preserve the streamed body.
	const headers = new Headers(response.headers);
	headers.set('X-Content-Type-Options', 'nosniff');
	headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	headers.set('X-Frame-Options', 'DENY');
	headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

	const isProductionHttps = !dev && event.url.protocol === 'https:';
	if (isProductionHttps) headers.set('Strict-Transport-Security', 'max-age=31536000');

	const hasPrivateResponse =
		Boolean(event.locals.token) ||
		event.isRemoteRequest ||
		event.request.headers.has('authorization') ||
		headers.has('set-cookie');
	if (hasPrivateResponse) headers.set('Cache-Control', 'private, no-store');

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers
	});
};

const appHandle: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;
		const token = getToken(event.cookies);
		event.locals.token = token;

		return withServerConvexToken(token, () =>
			resolve(event, {
				transformPageChunk: ({ html }) =>
					html.replace('%lang%', locale).replace('%dir%', getTextDirection(locale))
			})
		);
	});

export const handle: Handle = sequence(securityHandle, appHandle);

// Unexpected errors — log/report the real thing, return a sanitized App.Error so
// internals and stack traces never reach the client. Expected errors (thrown via
// `error()`) skip this hook entirely.
export const handleError: HandleServerError = ({ error, status, message }) => {
	console.error(`[handleError] ${status} ${message}`, error);
	return { message: 'Internal Error' };
};

// Remote-function argument validation failures — keep the generic 400 message
// so we don't help attackers probing the exposed endpoints.
export const handleValidationError: HandleValidationError = () => ({ message: 'Invalid request' });
