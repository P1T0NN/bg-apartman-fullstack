// LIBRARIES
import { v } from 'convex/values';

// BUILDERS
import { authenticatedQuery } from '../../../builders/convexFunctionBuilders.js';

// AUTH
import { getOwnerId } from '../../../betterAuth/helpers/requireIdentity.js';

// AGGREGATES
import { bookingHostAggregate } from '../aggregates/bookingHostAggregate.js';

// CONFIG
import { COMPANY_DATA } from '../../../../shared/config.js';

// HELPERS
import { getAnalyticsRange } from '../../../helpers/getAnalyticsRange.js';

// UTILS
import { getRevenueDayRanges } from '../../../../shared/features/analytics/utils/getRevenueDayRanges.js';

// VALIDATORS
import { analyticsRange, revenuePoint } from '../../../validators/analyticsValidators.js';

export const fetchHostRevenueSeries = authenticatedQuery({
	args: analyticsRange.fields,
	returns: v.array(revenuePoint),
	handler: async (ctx, args) => {
		const { from, to } = getAnalyticsRange(args.from, args.to);
		const namespace: [string, string] = [getOwnerId(ctx.identity), COMPANY_DATA.CURRENCY];
		const days = getRevenueDayRanges(from, to);
		const values = await bookingHostAggregate.sumBatch(
			ctx,
			days.map((range) => ({
				namespace,
				bounds: {
					lower: { key: range.from, inclusive: true },
					upper: { key: range.to, inclusive: true }
				}
			}))
		);
		return days.map(({ date }, index) => ({ date, revenue: values[index] }));
	}
});
