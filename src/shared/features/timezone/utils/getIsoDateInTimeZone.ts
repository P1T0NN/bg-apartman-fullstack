// LIBRARIES
import { fromAbsolute, toCalendarDate } from '@internationalized/date';

export function getIsoDateInTimeZone(timestamp: number, timeZone: string): string {
	return toCalendarDate(fromAbsolute(timestamp, timeZone)).toString();
}
