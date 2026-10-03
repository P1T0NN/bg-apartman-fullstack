// LIBRARIES
import type { z } from 'zod';

// CONFIG
import type { ACCOMMODATION_CONFIG } from '../config.js';

// SCHEMAS
import type { cancellationPolicySchema } from '../schemas/cancellationPolicySchemas.js';

export type CancellationPolicy = z.infer<typeof cancellationPolicySchema>;

export type CancellationPolicyRange =
	(typeof ACCOMMODATION_CONFIG.CANCELLATION_POLICY_RANGES)[number];

export type CancellationRefundPercentage =
	(typeof ACCOMMODATION_CONFIG.CANCELLATION_REFUND_PERCENTAGES)[number];

export type CancellationPolicyPeriod = {
	percentage: CancellationRefundPercentage;
	afterHours: number | null;
	untilHours: number;
};
