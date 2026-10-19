// LIBRARIES
import { v } from 'convex/values';

// BUILDERS
import { adminQuery } from '../../../builders/convexFunctionBuilders.js';

// AGGREGATES
import { flatFeeRevenueAggregate } from '../aggregates/flatFeeRevenueAggregate.js';
import { bookingFeeRevenueAggregate } from '../../bookingFeePayments/aggregates/bookingFeeAggregates.js';

// HELPERS
import { getAnalyticsRange } from '../../../helpers/getAnalyticsRange.js';

// CONFIG
import { COMPANY_DATA } from '../../../../shared/config.js';

// UTILS
import { getRevenueDayRanges } from '../../../../shared/features/analytics/utils/getRevenueDayRanges.js';

// VALIDATORS
import { analyticsRange, revenuePoint } from '../../../validators/analyticsValidators.js';

export const fetchAdminRevenueSeries = adminQuery({
	args: analyticsRange.fields,
	returns: v.array(revenuePoint),
	handler: async (ctx, args) => {
		const { from, to } = getAnalyticsRange(args.from, args.to);
		const days = getRevenueDayRanges(from, to);
		const queries = days.map((day) => ({
			namespace: COMPANY_DATA.CURRENCY,
			bounds: {
				lower: { key: day.from, inclusive: true },
				upper: { key: day.to, inclusive: true }
			}
		}));
		const [flatFees, bookingFees] = await Promise.all([
			flatFeeRevenueAggregate.sumBatch(ctx, queries),
			bookingFeeRevenueAggregate.sumBatch(ctx, queries)
		]);
		return days.map(({ date }, index) => ({ date, revenue: flatFees[index] + bookingFees[index] }));
	}
});
