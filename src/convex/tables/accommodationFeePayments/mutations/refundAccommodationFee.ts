// LIBRARIES
import { ConvexError, v } from 'convex/values';
import { internal } from '../../../_generated/api.js';
import { env } from '../../../_generated/server.js';

// BUILDERS
import { adminMutation } from '../../../builders/convexFunctionBuilders.js';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';

/** Development receipts reuse the same refund application as confirmed provider refunds. */
export const refundAccommodationFee = adminMutation({
	rateLimit: { name: 'accommodations:admin-refund-fee' },
	args: { paymentId: v.id('accommodationFeePayments'), expectedAmountMinor: v.number() },
	returns: v.null(),
	handler: async (ctx, args) => {
		const payment = await ctx.db.get('accommodationFeePayments', args.paymentId);

		if (!payment?.providerPaymentId)
			throw new ConvexError<BackendErrorData>({ code: 'FEE_REFUND_UNAVAILABLE' });

		const canSimulateRefund =
			env.CONVEX_CLOUD_URL === 'https://grateful-otter-919.eu-west-1.convex.cloud' &&
			payment.provider === 'development-simulation' &&
			payment.providerEnvironment === 'development';

		if (!canSimulateRefund) {
			throw new ConvexError<BackendErrorData>({ code: 'FEE_REFUND_NOT_SUPPORTED' });
		}

		await ctx.runMutation(
			internal.tables.accommodationFeePayments.mutations.requestFeeRefund.requestFeeRefund,
			args
		);

		await ctx.runMutation(
			internal.tables.accommodationFeePayments.mutations.applyFeeRefund.applyFeeRefund,
			{
				provider: payment.provider,
				providerPaymentId: payment.providerPaymentId,
				amountMinor: payment.terms.amountMinor,
				currency: payment.terms.currency,
				refundedAmountMinor: payment.terms.amountMinor,
				refundId: `development-refund-${payment._id}`,
				refundStatus: 'succeeded'
			}
		);
		return null;
	}
});
