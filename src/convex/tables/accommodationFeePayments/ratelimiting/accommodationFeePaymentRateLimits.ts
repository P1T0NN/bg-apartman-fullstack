// LIBRARIES
import { RateLimiter, type RunMutationCtx } from '@convex-dev/rate-limiter';

// CONVEX
import { components } from '../../../_generated/api.js';

// CONFIG
import { STRIPE_CONFIG } from '../../../../shared/features/stripe/config.js';

const rateLimiter = new RateLimiter(components.rateLimiter);

export async function limitFeeCheckoutCreation(ctx: RunMutationCtx, ownerId: string) {
	await rateLimiter.limit(ctx, 'stripe:checkout-creation:owner', {
		key: ownerId,
		config: STRIPE_CONFIG.checkoutCreationLimit,
		throws: true
	});
}
