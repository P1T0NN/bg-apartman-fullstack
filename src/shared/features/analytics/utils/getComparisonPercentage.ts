export function getComparisonPercentage(
	current: number | null,
	previous: number | null
): number | undefined {
	return current !== null && previous !== null && previous > 0
		? ((current - previous) / previous) * 100
		: undefined;
}
