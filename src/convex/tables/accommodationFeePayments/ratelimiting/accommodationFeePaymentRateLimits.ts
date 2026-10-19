// LIBRARIES
import { RateLimiter, type RunMutationCtx } from '@convex-dev/rate-limiter';

// CONVEX
import { components } from '../../../_generated/api.js';

// CONFIG
import { PAYMENTS_CONFIG } from '../../../../shared/features/payments/config.js';

const rateLimiter = new RateLimiter(components.rateLimiter);

export async function limitFeeCheckoutCreation(ctx: RunMutationCtx, ownerId: string) {
	await rateLimiter.limit(ctx, 'payments:checkout-creation:owner', {
		key: ownerId,
		config: PAYMENTS_CONFIG.checkoutCreationLimit,
		throws: true
	});
}
