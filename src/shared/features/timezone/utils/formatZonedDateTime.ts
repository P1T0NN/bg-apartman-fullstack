/** Include the offset at this instant, which can differ from today's offset. */
export function formatZonedDateTime(timestamp: number, locale: string, timeZone: string): string {
	return new Intl.DateTimeFormat(locale, {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		hourCycle: 'h23',
		timeZone,
		timeZoneName: 'longOffset'
	}).format(timestamp);
}
