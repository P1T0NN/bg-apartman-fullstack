import { ACCOMMODATION_CONFIG } from '../config.js';
import { displayCancellationPolicyPeriods } from './displayCancellationPolicyPeriods.js';
import type {
	CancellationPolicy,
	CancellationPolicyPreset
} from '../types/cancellationPolicyTypes.js';

/** Only replace a recorded schedule when every refund window is identical. */
export function getMatchingCancellationPreset(
	policy: CancellationPolicy
): CancellationPolicyPreset | null {
	if (policy.mode !== 'custom' && policy.mode !== 'full_refund') return policy;
	const periods = displayCancellationPolicyPeriods(policy);
	if (periods.length !== 2 || periods[0].percentage !== 100 || periods[1].percentage !== 0)
		return null;
	for (const mode of ACCOMMODATION_CONFIG.CANCELLATION_POLICY_MODES) {
		if (periods[0].untilHours === ACCOMMODATION_CONFIG.CANCELLATION_POLICY_HOURS[mode])
			return { version: 1, mode };
	}
	return null;
}
