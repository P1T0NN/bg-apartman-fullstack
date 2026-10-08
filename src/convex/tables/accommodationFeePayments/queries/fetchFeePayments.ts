// LIBRARIES
import { ConvexError, v } from 'convex/values';
import { paginationOptsValidator } from 'convex/server';

// BUILDERS
import { authenticatedQuery } from '../../../builders/convexFunctionBuilders.js';

// HELPERS
import { getPagination } from '../../../helpers/getPagination.js';
import { getOwnerId } from '../../../betterAuth/helpers/requireIdentity.js';

// VALIDATORS
import { feePaymentSummary } from '../validators/accommodationFeePaymentsValidators.js';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';

export const fetchFeePayments = authenticatedQuery({
	args: { accommodationId: v.id('accommodations'), paginationOpts: paginationOptsValidator },
	returns: v.object({
		items: v.array(feePaymentSummary),
		nextCursor: v.union(v.string(), v.null()),
		hasNextPage: v.boolean(),
		pageSize: v.number()
	}),
	handler: async (ctx, { accommodationId, paginationOpts }) => {
		const accommodation = await ctx.db.get('accommodations', accommodationId);

		const canReadFeeHistory =
			accommodation &&
			(accommodation.ownerId === getOwnerId(ctx.identity) || ctx.identity.role === 'admin');

		if (!canReadFeeHistory) throw new ConvexError<BackendErrorData>({ code: 'FORBIDDEN' });

		const source = ctx.db
			.query('accommodationFeePayments')
			.withIndex('by_accommodation_id', (q) => q.eq('accommodationId', accommodationId))
			.order('desc');

		const result = await getPagination(source, {
			paginationOpts: { ...paginationOpts, numItems: Math.min(paginationOpts.numItems, 20) }
		});

		return {
			...result,
			items: result.items.map((payment) => ({
				_id: payment._id,
				terms: payment.terms,
				status: payment.status,
				createdAt: payment.createdAt,
				paidAt: payment.paidAt,
				billingPeriodEndsAt: payment.billingPeriodEndsAt,
				refundedAmountMinor: payment.refundedAmountMinor,
				refundStatus: payment.refundStatus,
				updatedAt: payment.updatedAt
			}))
		};
	}
});
