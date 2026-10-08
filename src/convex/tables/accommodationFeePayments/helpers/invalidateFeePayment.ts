// CONVEX
import { internal } from '../../../_generated/api.js';

// HELPERS
import { getLatestFeePayment } from './getLatestFeePayment.js';

// TYPES
import type { MutationCtx } from '../../../_generated/server.js';
import type { Id } from '../../../_generated/dataModel.js';

/** Billing replacement and deletion invalidate checkout, without rewriting payment receipts. */
export async function invalidateFeePayment(
	ctx: MutationCtx,
	accommodationId: Id<'accommodations'>
) {
	const payment = await getLatestFeePayment(ctx, accommodationId);

	if (!payment) return;

	await ctx.db.patch('accommodationFeePayments', payment._id, {
		invalidated: true,
		entitlementApplied: false,
		updatedAt: Date.now()
	});

	const shouldExpireCheckout =
		payment.checkoutSessionId && (payment.status === 'pending' || payment.status === 'creating');

	if (shouldExpireCheckout)
		await ctx.scheduler.runAfter(
			0,
			internal.stripe.actions.reconcileFeeCheckout.reconcileFeeCheckout,
			{ paymentId: payment._id, expire: true }
		);
}
