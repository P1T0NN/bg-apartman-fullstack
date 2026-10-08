// CONVEX
import { internal } from '../../_generated/api.js';

// SCHEMAS
import { stripeRefundStatusSchema } from '../../../shared/features/stripe/schemas/stripeSchemas.js';

// HELPERS
import { createPaymentRefund } from './createPaymentRefund.js';
import { retrievePaymentRefundState } from './retrievePaymentRefundState.js';

// TYPES
import type { ActionCtx } from '../../_generated/server.js';
import type { Id } from '../../_generated/dataModel.js';

/** Stable per-request idempotency prevents concurrent admin/webhook retries refunding twice. */
export async function refundFeePayment(
	ctx: ActionCtx,
	paymentId: Id<'accommodationFeePayments'>
): Promise<void> {
	const payment = await ctx.runQuery(
		internal.tables.accommodationFeePayments.queries.getFeePayment.getFeePayment,
		{ paymentId }
	);

	const paymentIntentId = payment?.paymentIntentId;
	const refundAmountMinor = payment?.refundAmountMinor;
	const hasRefundRequest =
		payment && payment.status === 'refund_pending' && paymentIntentId && refundAmountMinor;
	if (!hasRefundRequest) return;

	const refund = await createPaymentRefund(
		paymentIntentId,
		refundAmountMinor,
		`accommodation-fee-refund:${paymentId}:${payment.refundAttempt ?? 1}`
	);

	const state = await retrievePaymentRefundState(paymentIntentId);

	await ctx.runMutation(
		internal.tables.accommodationFeePayments.mutations.applyFeeRefund.applyFeeRefund,
		{ ...state, refundId: refund.id, refundStatus: stripeRefundStatusSchema.parse(refund.status) }
	);
}
