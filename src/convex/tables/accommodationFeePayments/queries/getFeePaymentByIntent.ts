// LIBRARIES
import { v } from 'convex/values';

// CONVEX
import { internalQuery } from '../../../_generated/server.js';

// VALIDATORS
import { feePaymentDoc } from '../validators/accommodationFeePaymentsValidators.js';

// TYPES
import type { Doc } from '../../../_generated/dataModel.js';

export const getFeePaymentByIntent = internalQuery({
	args: { paymentIntentId: v.string() },
	returns: v.union(feePaymentDoc, v.null()),
	handler: (ctx, { paymentIntentId }): Promise<Doc<'accommodationFeePayments'> | null> =>
		ctx.db
			.query('accommodationFeePayments')
			.withIndex('by_payment_intent_id', (q) => q.eq('paymentIntentId', paymentIntentId))
			.unique()
});
