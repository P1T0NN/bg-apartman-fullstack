// LIBRARIES
import { ConvexError } from 'convex/values';

// CONFIG
import { COMPANY_DATA } from '../../shared/config.js';
import { MAX_RANGE_DAYS } from '../../shared/features/analytics/config.js';

// UTILS
import { DAY_IN_MS, getStoreDayKey } from '../../shared/utils/date.js';

// TYPES
import type { BackendErrorData } from '../../shared/types/types.js';

export function getAnalyticsRange(from: number, to: number) {
	const isValidRange =
		Number.isSafeInteger(from) &&
		Number.isSafeInteger(to) &&
		from >= 0 &&
		to >= from &&
		to <= Date.UTC(9999, 11, 31, 23, 59, 59, 999) &&
		(getStoreDayKey(to, COMPANY_DATA.TIMEZONE) - getStoreDayKey(from, COMPANY_DATA.TIMEZONE)) /
			DAY_IN_MS +
			1 <=
			MAX_RANGE_DAYS;
	if (!isValidRange) throw new ConvexError<BackendErrorData>({ code: 'INVALID_ANALYTICS_RANGE' });
	return { from, to };
}
