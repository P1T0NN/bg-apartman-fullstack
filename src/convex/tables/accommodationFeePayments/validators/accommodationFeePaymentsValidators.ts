// LIBRARIES
import { docValidator } from 'convex/server';
import { v } from 'convex/values';

// SCHEMAS
import { accommodationFeePayments } from '../schema.js';

export const feePaymentDoc = docValidator('accommodationFeePayments', accommodationFeePayments);

export const feePaymentSummary = feePaymentDoc.pick(
	'_id',
	'terms',
	'status',
	'createdAt',
	'paidAt',
	'billingPeriodEndsAt',
	'refundedAmountMinor',
	'refundStatus',
	'updatedAt'
);

export const feePaymentConfirmation = v.object({
	...feePaymentSummary.fields,
	accommodationName: v.string(),
	isCurrentPaidPeriod: v.boolean()
});
