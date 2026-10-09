// CONFIG
import { ACCOMMODATION_CONFIG } from '../config.js';

// TYPES
import type {
	CancellationPolicy,
	CancellationPolicyPeriod
} from '../types/cancellationPolicyTypes.js';

/** Chronological refund periods, merging adjacent equal outcomes for guest display. */
export function displayCancellationPolicyPeriods(
	policy: CancellationPolicy
): CancellationPolicyPeriod[] {
	if (policy.mode === 'full_refund') return [{ percentage: 100, afterHours: null, untilHours: 0 }];
	if (policy.mode !== 'custom') {
		const hours = ACCOMMODATION_CONFIG.CANCELLATION_POLICY_HOURS[policy.mode];
		return [
			{ percentage: 100, afterHours: null, untilHours: hours },
			{ percentage: 0, afterHours: hours, untilHours: 0 }
		];
	}
	const hours = ACCOMMODATION_CONFIG.CANCELLATION_POLICY_DEADLINE_HOURS;

	const percentages = [
		100,
		...ACCOMMODATION_CONFIG.CANCELLATION_POLICY_RANGES.map((range) => policy[range])
	] as const;

	const thresholds = [
		hours.sevenDaysOrMore,
		hours.fiveToSevenDays,
		hours.threeToFiveDays,
		hours.oneToThreeDays,
		0
	];

	const periods: CancellationPolicyPeriod[] = [];

	let afterHours: number | null = null;

	for (const [index, untilHours] of thresholds.entries()) {
		const percentage = percentages[index];
		const previous = periods.at(-1);
		if (previous?.percentage === percentage) previous.untilHours = untilHours;
		else periods.push({ percentage, afterHours, untilHours });
		afterHours = untilHours;
	}

	return periods;
}
