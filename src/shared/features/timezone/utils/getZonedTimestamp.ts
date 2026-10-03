// LIBRARIES
import { parseDateTime } from '@internationalized/date';

/** Reject missing or repeated local times during daylight-saving transitions. */
export function getZonedTimestamp(date: string, time: string, timeZone: string): number {
	return parseDateTime(`${date}T${time}`).toDate(timeZone, 'reject').getTime();
}
