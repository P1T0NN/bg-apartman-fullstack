// LIBRARIES
import { v } from 'convex/values';

// CONVEX
import { internalAction } from '../../_generated/server.js';

// HELPERS
import { reconcileFeePayment } from '../helpers/reconcileFeePayment.js';

export const reconcileFeeCheckout = internalAction({
	args: { paymentId: v.id('accommodationFeePayments') },
	returns: v.null(),
	handler: async (ctx, { paymentId }) => {
		await reconcileFeePayment(ctx, paymentId);
		return null;
	}
});
