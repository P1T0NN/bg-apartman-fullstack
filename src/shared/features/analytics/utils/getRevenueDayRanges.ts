// LIBRARIES
import { parseDate } from '@internationalized/date';

// CONFIG
import { COMPANY_DATA } from '../../../config.js';

// UTILS
import { getIsoDateInTimeZone } from '../../timezone/utils/getIsoDateInTimeZone.js';

export function getRevenueDayRanges(from: number, to: number) {
	const timeZone = COMPANY_DATA.TIMEZONE;
	let day = parseDate(getIsoDateInTimeZone(from, timeZone));
	const lastDay = parseDate(getIsoDateInTimeZone(to, timeZone));
	const days: { date: number; from: number; to: number }[] = [];
	while (day.compare(lastDay) <= 0) {
		const date = day.toDate(timeZone).getTime();
		const nextDay = day.add({ days: 1 });
		const isLastDay = day.compare(lastDay) === 0;
		days.push({
			date,
			from: Math.max(from, date),
			to: isLastDay ? to : nextDay.toDate(timeZone).getTime() - 1
		});
		if (isLastDay) break;
		day = nextDay;
	}
	return days;
}
