// CONVEX
import { internal } from '../../_generated/api.js';

// SCHEMAS
import {
	checkoutActionsSchema,
	checkoutRefundSchema
} from '../../../shared/features/checkout/schemas/checkoutSchemas.js';

// HELPERS
import { checkoutRequest } from './checkoutRequest.js';

// TYPES
import type { ActionCtx } from '../../_generated/server.js';
import type { Doc } from '../../_generated/dataModel.js';

export async function reconcileFeeRefund(
	ctx: ActionCtx,
	payment: Doc<'accommodationFeePayments'>,
	refundedAmountMinor: number
): Promise<void> {
	if (payment.status !== 'refund_pending') return;
	const providerPaymentId = payment.providerPaymentId;
	if (!providerPaymentId) throw new Error('Refund has no provider payment reference');
	const { amountMinor, currency } = payment.terms;
	const applyRefund =
		internal.tables.accommodationFeePayments.mutations.applyFeeRefund.applyFeeRefund;
	if (!payment.refundId) {
		const refund = await checkoutRequest(
			`/payments/${encodeURIComponent(providerPaymentId)}/refunds`,
			checkoutRefundSchema,
			{
				method: 'POST',
				headers: {
					'Cko-Idempotency-Key': `fee-refund-${payment._id}-${payment.refundAttempt ?? 1}`
				},
				body: JSON.stringify({ amount: payment.refundAmountMinor, reference: payment._id })
			}
		);
		await ctx.runMutation(applyRefund, {
			provider: 'checkout',
			providerPaymentId,
			amountMinor,
			currency,
			refundedAmountMinor,
			refundId: refund.action_id,
			refundStatus: 'pending'
		});
	} else {
		const actions = await checkoutRequest(
			`/payments/${encodeURIComponent(providerPaymentId)}/actions`,
			checkoutActionsSchema
		);
		const refundAction = actions.find(
			(item) => item.id === payment.refundId && item.type === 'Refund'
		);
		await ctx.runMutation(applyRefund, {
			provider: 'checkout',
			providerPaymentId,
			amountMinor,
			currency,
			refundedAmountMinor,
			refundId: payment.refundId,
			refundStatus:
				refundAction?.approved === true
					? 'succeeded'
					: refundAction?.approved === false
						? 'failed'
						: 'pending'
		});
	}
}
