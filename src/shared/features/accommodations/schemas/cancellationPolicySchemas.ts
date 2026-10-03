// LIBRARIES
import { z } from 'zod';

// CONFIG
import { ACCOMMODATION_CONFIG } from '../config.js';

const refundPercentageSchema = z.union(
	ACCOMMODATION_CONFIG.CANCELLATION_REFUND_PERCENTAGES.map((percentage) => z.literal(percentage))
);

export const cancellationPolicySchema = z
	.discriminatedUnion('mode', [
		z.object({ version: z.literal(1), mode: z.literal('full_refund') }),
		z.object({
			version: z.literal(1),
			mode: z.literal('custom'),
			fiveToSevenDays: refundPercentageSchema,
			threeToFiveDays: refundPercentageSchema,
			oneToThreeDays: refundPercentageSchema,
			under24Hours: refundPercentageSchema
		})
	])
	.superRefine((policy, context) => {
		if (policy.mode !== 'custom') return;
		let previousPercentage = 100;
		for (const range of ACCOMMODATION_CONFIG.CANCELLATION_POLICY_RANGES) {
			if (policy[range] > previousPercentage) {
				context.addIssue({ code: 'custom', path: [range], message: 'REFUND_INCREASES' });
			}
			previousPercentage = policy[range];
		}
	});

export const accommodationCancellationPolicySchema = z.object({
	cancellationPolicy: cancellationPolicySchema
});
