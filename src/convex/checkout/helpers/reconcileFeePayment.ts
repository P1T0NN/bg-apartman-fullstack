// CONVEX
import { internal } from '../../_generated/api.js';

// SCHEMAS
import {
	checkoutPaymentSchema,
	hostedCheckoutDetailsSchema
} from '../../../shared/features/checkout/schemas/checkoutSchemas.js';

// HELPERS
import { checkoutRequest } from './checkoutRequest.js';
import { getCheckoutConfig } from './getCheckoutConfig.js';
import { reconcileFeeRefund } from './reconcileFeeRefund.js';

// TYPES
import type { ActionCtx } from '../../_generated/server.js';
import type { Id } from '../../_generated/dataModel.js';

export async function reconcileFeePayment(
	ctx: ActionCtx,
	paymentId: Id<'accommodationFeePayments'>
): Promise<void> {
	const payment = await ctx.runQuery(
		internal.tables.accommodationFeePayments.queries.fetchFeePayment.fetchFeePayment,
		{ paymentId }
	);
	if (!payment) return;
	const { channelId } = getCheckoutConfig();
	const matchesAccount =
		payment.provider === 'checkout' &&
		payment.providerEnvironment === 'sandbox' &&
		payment.providerAccountId === channelId;
	if (!matchesAccount) throw new Error('Checkout.com account does not match the payment');
	const saveReconciliation =
		internal.tables.accommodationFeePayments.mutations.saveFeeReconciliation.saveFeeReconciliation;
	if (!payment.providerCheckoutId) {
		await ctx.runMutation(saveReconciliation, { paymentId, retry: true });
		return;
	}
	const hosted = await checkoutRequest(
		`/hosted-payments/${encodeURIComponent(payment.providerCheckoutId)}`,
		hostedCheckoutDetailsSchema
	);
	const matchesCheckout =
		hosted.id === payment.providerCheckoutId &&
		hosted.reference === payment._id &&
		hosted.amount === payment.terms.amountMinor &&
		hosted.currency === payment.terms.currency;
	if (!matchesCheckout) throw new Error('Checkout.com session does not match the recorded fee');
	const apply =
		internal.tables.accommodationFeePayments.mutations.applyFeeCheckout.applyFeeCheckout;
	if (!hosted.payment_id) {
		await ctx.runMutation(apply, {
			paymentId,
			provider: 'checkout',
			providerCheckoutId: hosted.id,
			amountMinor: hosted.amount,
			currency: hosted.currency,
			status: hosted.status === 'Expired' ? 'expired' : 'pending',
			refundedAmountMinor: 0
		});
		await ctx.runMutation(saveReconciliation, { paymentId, retry: hosted.status !== 'Expired' });
		return;
	}
	const details = await checkoutRequest(
		`/payments/${encodeURIComponent(hosted.payment_id)}`,
		checkoutPaymentSchema
	);
	const captured = details.balances.total_captured;
	const refunded = details.balances.total_refunded;
	const matchesPayment =
		details.id === hosted.payment_id &&
		details.reference === payment._id &&
		details.amount === payment.terms.amountMinor &&
		details.currency === payment.terms.currency &&
		captured <= details.amount &&
		refunded <= captured;
	if (!matchesPayment) throw new Error('Checkout.com payment does not match the recorded fee');
	const fullyCaptured = captured === details.amount;
	const closedUnpaid = captured === 0 && hosted.status === 'Expired';
	await ctx.runMutation(apply, {
		paymentId,
		provider: 'checkout',
		providerCheckoutId: hosted.id,
		providerPaymentId: details.id,
		amountMinor: details.amount,
		currency: details.currency,
		status: fullyCaptured ? 'paid' : closedUnpaid ? 'expired' : 'processing',
		refundedAmountMinor: refunded
	});
	const applyRefund =
		internal.tables.accommodationFeePayments.mutations.applyFeeRefund.applyFeeRefund;
	await ctx.runMutation(applyRefund, {
		provider: 'checkout',
		providerPaymentId: details.id,
		amountMinor: details.amount,
		currency: details.currency,
		refundedAmountMinor: refunded
	});
	const current = await ctx.runQuery(
		internal.tables.accommodationFeePayments.queries.fetchFeePayment.fetchFeePayment,
		{ paymentId }
	);
	if (!current) return;
	await reconcileFeeRefund(ctx, current, refunded);
	const retry =
		(!fullyCaptured && !closedUnpaid) ||
		(current.status === 'refund_pending' && refunded < details.amount);
	await ctx.runMutation(saveReconciliation, { paymentId, retry });
}
