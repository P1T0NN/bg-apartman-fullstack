// BUILDERS
import { authenticatedQuery } from '../../../builders/convexFunctionBuilders.js';

// AUTH
import { getOwnerId } from '../../../betterAuth/helpers/requireIdentity.js';

// AGGREGATES
import { bookingHostAggregate } from '../aggregates/bookingHostAggregate.js';
import {
	bookingFeePendingAggregate,
	bookingFeePaidAggregate
} from '../../bookingFeePayments/aggregates/bookingFeeAggregates.js';

// CONFIG
import { COMPANY_DATA } from '../../../../shared/config.js';

// HELPERS
import { getAnalyticsRange } from '../../../helpers/getAnalyticsRange.js';

// UTILS
import { getPreviousRangeBounds } from '../../../../shared/features/analytics/utils/getPreviousRangeBounds.js';

// VALIDATORS
import { hostDashboardComparison } from '../validators/hostAnalyticsValidators.js';
import { analyticsRange } from '../../../validators/analyticsValidators.js';

export const fetchHostDashboard = authenticatedQuery({
	args: analyticsRange.fields,
	returns: hostDashboardComparison,
	handler: async (ctx, args) => {
		const current = getAnalyticsRange(args.from, args.to);
		const previous = getPreviousRangeBounds({
			from: new Date(current.from),
			to: new Date(current.to)
		});
		const namespace: [string, string] = [getOwnerId(ctx.identity), COMPANY_DATA.CURRENCY];
		const ranges = [current, { from: previous.from.getTime(), to: previous.to.getTime() }];
		const queries = ranges.map((range) => ({
			namespace,
			bounds: {
				lower: { key: range.from, inclusive: true },
				upper: { key: range.to, inclusive: true }
			}
		}));
		const [counts, values, feesPending, feesPaid] = await Promise.all([
			bookingHostAggregate.countBatch(ctx, queries),
			bookingHostAggregate.sumBatch(ctx, queries),
			bookingFeePendingAggregate.sum(ctx, { namespace }),
			bookingFeePaidAggregate.sumBatch(ctx, queries)
		]);
		const stats = ranges.map((_range, index) => ({
			bookings: counts[index],
			revenue: values[index],
			bookingFeesPaid: feesPaid[index],
			cancellationRate: null
		}));
		return { current: stats[0], previous: stats[1], bookingFeesPending: feesPending };
	}
});
