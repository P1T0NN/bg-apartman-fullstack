/** Calendar months in UTC, clamped at month end; never approximate a month as 30 days. */
export function calculatePaidPeriodEnd(start: number, months: number): number {
	const hasInvalidPeriod =
		!Number.isSafeInteger(start) || !Number.isSafeInteger(months) || months <= 0;

	if (hasInvalidPeriod) throw new Error('Invalid paid period');

	const end = new Date(start);
	const day = end.getUTCDate();
	end.setUTCDate(1);
	end.setUTCMonth(end.getUTCMonth() + months);

	const lastDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)).getUTCDate();

	end.setUTCDate(Math.min(day, lastDay));

	const isValidDeadline = Number.isFinite(end.getTime());

	if (!isValidDeadline) throw new Error('Invalid paid period');

	return end.getTime();
}
