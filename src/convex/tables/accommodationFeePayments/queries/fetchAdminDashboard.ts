// LIBRARIES
import { v } from 'convex/values';

// BUILDERS
import { adminQuery } from '../../../builders/convexFunctionBuilders.js';

// AGGREGATES
import { flatFeeRevenueAggregate } from '../aggregates/flatFeeRevenueAggregate.js';
import { bookingAdminAggregate } from '../../bookings/aggregates/bookingAdminAggregate.js';
import { bookingFeeRevenueAggregate } from '../../bookingFeePayments/aggregates/bookingFeeAggregates.js';

// HELPERS
import { getAnalyticsRange } from '../../../helpers/getAnalyticsRange.js';

// CONFIG
import { COMPANY_DATA } from '../../../../shared/config.js';

// UTILS
import { getPreviousRangeBounds } from '../../../../shared/features/analytics/utils/getPreviousRangeBounds.js';

// VALIDATORS
import { analyticsRange } from '../../../validators/analyticsValidators.js';

const stats = v.object({
	revenue: v.number(),
	flatFeeRevenue: v.number(),
	bookingFeeRevenue: v.number(),
	bookings: v.number(),
	cancellationRate: v.number()
});

export const fetchAdminDashboard = adminQuery({
	args: analyticsRange.fields,
	returns: v.object({ current: stats, previous: stats }),
	handler: async (ctx, args) => {
		const current = getAnalyticsRange(args.from, args.to);
		const previous = getPreviousRangeBounds({
			from: new Date(current.from),
			to: new Date(current.to)
		});
		const ranges = [current, { from: previous.from.getTime(), to: previous.to.getTime() }];
		const queries = ranges.map((range) => ({
			bounds: {
				lower: { key: range.from, inclusive: true },
				upper: { key: range.to, inclusive: true }
			}
		}));
		const [revenue, bookingFeeRevenue, counts, cancellations] = await Promise.all([
			flatFeeRevenueAggregate.sumBatch(
				ctx,
				queries.map((query) => ({ ...query, namespace: COMPANY_DATA.CURRENCY }))
			),
			bookingFeeRevenueAggregate.sumBatch(
				ctx,
				queries.map((query) => ({ ...query, namespace: COMPANY_DATA.CURRENCY }))
			),
			bookingAdminAggregate.countBatch(ctx, queries),
			bookingAdminAggregate.sumBatch(ctx, queries)
		]);
		const values = ranges.map((_range, index) => ({
			revenue: revenue[index] + bookingFeeRevenue[index],
			flatFeeRevenue: revenue[index],
			bookingFeeRevenue: bookingFeeRevenue[index],
			bookings: counts[index],
			cancellationRate: counts[index] ? (cancellations[index] / counts[index]) * 100 : 0
		}));
		return { current: values[0], previous: values[1] };
	}
});
