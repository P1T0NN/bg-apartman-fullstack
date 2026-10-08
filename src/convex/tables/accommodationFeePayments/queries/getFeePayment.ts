// LIBRARIES
import { v } from 'convex/values';

// CONVEX
import { internalQuery } from '../../../_generated/server.js';

// VALIDATORS
import { feePaymentDoc } from '../validators/accommodationFeePaymentsValidators.js';

// TYPES
import type { Doc } from '../../../_generated/dataModel.js';

export const getFeePayment = internalQuery({
	args: { paymentId: v.id('accommodationFeePayments') },
	returns: v.union(feePaymentDoc, v.null()),
	handler: (ctx, { paymentId }): Promise<Doc<'accommodationFeePayments'> | null> =>
		ctx.db.get('accommodationFeePayments', paymentId)
});
