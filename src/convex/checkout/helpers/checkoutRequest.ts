// LIBRARIES
import type { z } from 'zod';

// CONFIG
import { CHECKOUT_CONFIG } from '../../../shared/features/checkout/config.js';

// HELPERS
import { getCheckoutConfig } from './getCheckoutConfig.js';

// ERRORS
import { CheckoutApiError } from '../errors/CheckoutApiError.js';

export async function checkoutRequest<T>(
	path: string,
	schema: z.ZodType<T>,
	init?: RequestInit
): Promise<T> {
	const config = getCheckoutConfig();
	const headers = new Headers(init?.headers);
	headers.set('Authorization', `Bearer ${config.secret}`);
	headers.set('Content-Type', 'application/json');
	const response = await fetch(`${config.baseUrl}${path}`, {
		...init,
		headers,
		signal: AbortSignal.timeout(CHECKOUT_CONFIG.requestTimeoutMs)
	});
	if (!response.ok) throw new CheckoutApiError(response.status);
	const parsed = schema.safeParse(await response.json());
	if (!parsed.success) throw new Error('Unexpected Checkout.com response');
	return parsed.data;
}
