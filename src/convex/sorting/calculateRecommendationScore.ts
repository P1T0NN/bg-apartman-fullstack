/**
 * Review-adjusted rating: few reviews stay closer to the supplied baseline.
 * baselineWeight is the number of reviews represented by that baseline.
 * Pass both settings from the owning domain; no table or rating scale is assumed.
 */
export function calculateRecommendationScore({
	average,
	count,
	baselineAverage,
	baselineWeight
}: {
	average: number | null;
	count: number;
	baselineAverage: number;
	baselineWeight: number;
}): number {
	if (!Number.isSafeInteger(count) || count < 0) {
		throw new RangeError('Review count must be a non-negative safe integer.');
	}

	if (!Number.isFinite(baselineAverage)) {
		throw new RangeError('Baseline average must be finite.');
	}

	if (!Number.isSafeInteger(baselineWeight) || baselineWeight <= 0) {
		throw new RangeError('Baseline weight must be a positive safe integer.');
	}

	if (count === 0) return baselineAverage;

	if (average === null || !Number.isFinite(average)) {
		throw new RangeError('A finite average is required when reviews exist.');
	}

	const reviewWeight = count / (count + baselineWeight);

	return reviewWeight * average + (1 - reviewWeight) * baselineAverage;
}
