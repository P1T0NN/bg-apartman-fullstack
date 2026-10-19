// LIBRARIES
import { ConvexError, v } from 'convex/values';

// CONVEX
import { internal } from '../../../_generated/api.js';

// BUILDERS
import { authenticatedAction } from '../../../builders/convexFunctionBuilders.js';

// HELPERS
import { getOwnerId } from '../../../betterAuth/helpers/requireIdentity.js';
import { reconcileFeePayment } from '../../../checkout/helpers/reconcileFeePayment.js';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';

export const refreshFeePayment = authenticatedAction({
	args: { paymentId: v.id('accommodationFeePayments') },
	returns: v.null(),
	handler: async (ctx, { paymentId }) => {
		const payment = await ctx.runQuery(
			internal.tables.accommodationFeePayments.queries.fetchFeePayment.fetchFeePayment,
			{ paymentId }
		);
		if (!payment || payment.ownerId !== getOwnerId(ctx.identity))
			throw new ConvexError<BackendErrorData>({ code: 'FORBIDDEN' });
		await reconcileFeePayment(ctx, paymentId);
		return null;
	}
});
