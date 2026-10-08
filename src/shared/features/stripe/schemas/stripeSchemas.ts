// LIBRARIES
import { z } from 'zod';

export const stripeObjectIdSchema = z
	.union([z.string(), z.object({ id: z.string() }).transform((value) => value.id)])
	.nullable();

export const stripeChargeRefundSchema = z.object({
	amount: z.number().int(),
	currency: z.string(),
	amount_refunded: z.number().int()
});

export const stripeCheckoutStatusSchema = z.enum(['open', 'complete', 'expired']).nullable();

export const stripeRefundStatusSchema = z
	.enum(['pending', 'requires_action', 'succeeded', 'failed', 'canceled'])
	.nullish()
	.transform((status) => status ?? 'pending');
