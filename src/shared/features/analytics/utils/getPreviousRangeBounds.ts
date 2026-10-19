// LIBRARIES
import { parseDate } from '@internationalized/date';

// CONFIG
import { COMPANY_DATA } from '../../../config.js';

// UTILS
import { DAY_IN_MS, getStoreDayKey } from '../../../utils/date.js';
import { getIsoDateInTimeZone } from '../../timezone/utils/getIsoDateInTimeZone.js';

// TYPES
import type { RangeBounds } from '../types/analyticsTypes.js';

export function getPreviousRangeBounds(
	bounds: RangeBounds,
	timeZone: string = COMPANY_DATA.TIMEZONE
): RangeBounds {
	const from = bounds.from.getTime();
	const fromDay = getStoreDayKey(from, timeZone);
	const toDay = getStoreDayKey(bounds.to.getTime(), timeZone);
	const dayCount = Math.max(1, (toDay - fromDay) / DAY_IN_MS + 1);

	return {
		from: parseDate(getIsoDateInTimeZone(from, timeZone))
			.subtract({ days: dayCount })
			.toDate(timeZone),
		to: new Date(from - 1)
	};
}
