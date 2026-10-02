// LIBRARIES
import { expect, it } from 'vitest';

// UTILS
import { calculateRecommendationScore } from '../../src/convex/sorting/calculateRecommendationScore.js';

it('uses a neutral baseline and gives established ratings more influence', () => {
	const baseline = { baselineAverage: 3, baselineWeight: 5 };
	const unrated = calculateRecommendationScore({ ...baseline, average: null, count: 0 });
	const onePerfectReview = calculateRecommendationScore({ ...baseline, average: 5, count: 1 });
	const established = calculateRecommendationScore({ ...baseline, average: 4.5, count: 100 });

	expect(unrated).toBe(3);
	expect(onePerfectReview).toBeCloseTo(20 / 6);
	expect(established).toBeGreaterThan(onePerfectReview);
	expect(established).toBeLessThan(4.5);
	expect(calculateRecommendationScore({ ...baseline, average: 1, count: 100 })).toBeLessThan(
		unrated
	);
	// The same calculation supports another domain's rating scale and baseline.
	expect(
		calculateRecommendationScore({ average: 8, count: 5, baselineAverage: 6, baselineWeight: 5 })
	).toBe(7);
});

it('rejects invalid summaries and baseline settings', () => {
	const valid = { average: 4, count: 10, baselineAverage: 3, baselineWeight: 5 };
	for (const invalid of [
		{ count: -1 },
		{ count: 0.5 },
		{ count: Infinity },
		{ average: null },
		{ average: NaN },
		{ baselineAverage: Infinity },
		{ baselineWeight: 0 },
		{ baselineWeight: -1 },
		{ baselineWeight: NaN }
	]) {
		expect(() => calculateRecommendationScore({ ...valid, ...invalid })).toThrow(RangeError);
	}
});
