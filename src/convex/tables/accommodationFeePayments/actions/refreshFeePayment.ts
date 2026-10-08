'use node';

// LIBRARIES
import { ConvexError, v } from 'convex/values';
import { internal } from '../../../_generated/api.js';

// BUILDERS
import { authenticatedAction } from '../../../builders/convexFunctionBuilders.js';

// HELPERS
import { retrieveCheckoutSession } from '../../../stripe/helpers/retrieveCheckoutSession.js';
import { applyFeeCheckoutSession } from '../../../stripe/helpers/applyFeeCheckoutSession.js';
import { getOwnerId } from '../../../betterAuth/helpers/requireIdentity.js';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';

export const refreshFeePayment = authenticatedAction({
	rateLimit: { name: 'accommodations:refresh-flat-fee' },
	args: { paymentId: v.id('accommodationFeePayments') },
	returns: v.null(),
	handler: async (ctx, { paymentId }) => {
		const payment = await ctx.runQuery(
			internal.tables.accommodationFeePayments.queries.getFeePayment.getFeePayment,
			{ paymentId }
		);

		const canReadPayment =
			payment && (payment.ownerId === getOwnerId(ctx.identity) || ctx.identity.role === 'admin');

		if (!canReadPayment) throw new ConvexError<BackendErrorData>({ code: 'FORBIDDEN' });

		if (payment.checkoutSessionId)
			await applyFeeCheckoutSession(ctx, await retrieveCheckoutSession(payment.checkoutSessionId));

		return null;
	}
});
