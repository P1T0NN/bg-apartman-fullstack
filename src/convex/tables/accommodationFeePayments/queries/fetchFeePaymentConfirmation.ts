// LIBRARIES
import { v } from 'convex/values';

// BUILDERS
import { authenticatedQuery } from '../../../builders/convexFunctionBuilders.js';

// HELPERS
import { getOwnerId } from '../../../betterAuth/helpers/requireIdentity.js';

// VALIDATORS
import { feePaymentConfirmation } from '../validators/accommodationFeePaymentsValidators.js';

export const fetchFeePaymentConfirmation = authenticatedQuery({
	args: { paymentId: v.id('accommodationFeePayments') },
	returns: v.union(feePaymentConfirmation, v.null()),
	handler: async (ctx, { paymentId }) => {
		const payment = await ctx.db.get('accommodationFeePayments', paymentId);
		const canReadPayment = payment && payment.ownerId === getOwnerId(ctx.identity);
		if (!canReadPayment) return null;
		const accommodation = await ctx.db.get('accommodations', payment.accommodationId);
		const isOwnedAccommodation =
			accommodation && accommodation.ownerId === getOwnerId(ctx.identity);
		if (!isOwnedAccommodation) return null;
		const isCurrentPaidPeriod =
			payment.status === 'paid' &&
			payment.entitlementApplied &&
			!payment.invalidated &&
			accommodation.status !== 'deleted' &&
			accommodation.billingStatus === 'active' &&
			accommodation.billingPlanId === 'flat_fee' &&
			accommodation.billingPeriodEndsAt === payment.billingPeriodEndsAt &&
			payment.billingPeriodEndsAt !== undefined &&
			payment.billingPeriodEndsAt > Date.now();
		return {
			_id: payment._id,
			terms: payment.terms,
			status: payment.status,
			createdAt: payment.createdAt,
			paidAt: payment.paidAt,
			billingPeriodEndsAt: payment.billingPeriodEndsAt,
			refundedAmountMinor: payment.refundedAmountMinor,
			refundStatus: payment.refundStatus,
			updatedAt: payment.updatedAt,
			accommodationName: accommodation.name,
			isCurrentPaidPeriod
		};
	}
});
