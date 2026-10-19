import { v } from 'convex/values';
import { internalQuery } from '../../../_generated/server.js';
import { getLatestFeePayment } from '../helpers/getLatestFeePayment.js';

export const fetchFeePaymentCaptureEligibility = internalQuery({
	args: { paymentId: v.id('accommodationFeePayments') },
	returns: v.boolean(),
	handler: async (ctx, { paymentId }) => {
		const payment = await ctx.db.get('accommodationFeePayments', paymentId);
		if (
			!payment ||
			payment.invalidated ||
			payment.closedAt ||
			payment.status === 'paid' ||
			payment.status === 'refund_pending' ||
			payment.status === 'refunded'
		)
			return false;
		const accommodation = await ctx.db.get('accommodations', payment.accommodationId);
		const latest = await getLatestFeePayment(ctx, payment.accommodationId);
		const terms = accommodation?.billingTerms;
		return Boolean(
			accommodation &&
			accommodation.ownerId === payment.ownerId &&
			accommodation.status !== 'deleted' &&
			accommodation.billingPlanId === 'flat_fee' &&
			terms?.model === 'flat_fee' &&
			terms.amountMinor === payment.terms.amountMinor &&
			terms.currency === payment.terms.currency &&
			terms.intervalMonths === payment.terms.intervalMonths &&
			latest?._id === paymentId &&
			!(
				accommodation.billingStatus === 'active' &&
				accommodation.billingPeriodEndsAt !== null &&
				accommodation.billingPeriodEndsAt > Date.now()
			)
		);
	}
});
