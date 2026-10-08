'use node';

// LIBRARIES
import { v } from 'convex/values';
import { internal } from '../../../_generated/api.js';

// BUILDERS
import { authenticatedAction } from '../../../builders/convexFunctionBuilders.js';

// HELPERS
import { refundFeePayment } from '../../../stripe/helpers/refundFeePayment.js';
import { requireAdminIdentity } from '../../../betterAuth/helpers/requireIdentity.js';

export const refundAccommodationFee = authenticatedAction({
	rateLimit: { name: 'accommodations:admin-refund-flat-fee' },
	args: { paymentId: v.id('accommodationFeePayments'), expectedAmountMinor: v.number() },
	returns: v.null(),
	handler: async (ctx, args) => {
		await requireAdminIdentity(ctx);

		await ctx.runMutation(
			internal.tables.accommodationFeePayments.mutations.requestFeeRefund.requestFeeRefund,
			args
		);

		await refundFeePayment(ctx, args.paymentId);

		return null;
	}
});
