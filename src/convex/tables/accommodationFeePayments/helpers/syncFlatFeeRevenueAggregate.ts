// AGGREGATES
import { flatFeeRevenueAggregate } from '../aggregates/flatFeeRevenueAggregate.js';

// TYPES
import type { Doc } from '../../../_generated/dataModel.js';
import type { MutationCtx } from '../../../_generated/server.js';

export async function syncFlatFeeRevenueAggregate(
	ctx: MutationCtx,
	payment: Doc<'accommodationFeePayments'>
) {
	const wasCollected =
		payment.paidAt !== undefined &&
		(payment.status === 'paid' ||
			payment.status === 'refund_pending' ||
			payment.status === 'refunded');
	if (wasCollected) await flatFeeRevenueAggregate.replaceOrInsert(ctx, payment, payment);
	else await flatFeeRevenueAggregate.deleteIfExists(ctx, payment);
}
