// TYPES
import type { QueryCtx } from '../../../_generated/server.js';
import type { Id } from '../../../_generated/dataModel.js';

export function getLatestFeePayment(
	ctx: Pick<QueryCtx, 'db'>,
	accommodationId: Id<'accommodations'>
) {
	return ctx.db
		.query('accommodationFeePayments')
		.withIndex('by_accommodation_id', (q) => q.eq('accommodationId', accommodationId))
		.order('desc')
		.first();
}
