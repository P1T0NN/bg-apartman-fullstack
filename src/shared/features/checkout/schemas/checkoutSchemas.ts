// LIBRARIES
import { z } from 'zod';

const minorAmount = z.number().int().nonnegative().safe();
const checkoutId = z.string().regex(/^hpp_[A-Za-z0-9_-]{12}$/);
const paymentId = z.string().regex(/^pay_[A-Za-z0-9_]{26}$/);

export const hostedCheckoutSchema = z.object({
	id: checkoutId,
	_links: z.object({ redirect: z.object({ href: z.url() }) })
});

export const hostedCheckoutDetailsSchema = z.object({
	id: checkoutId,
	status: z.enum(['Payment Pending', 'Payment Received', 'Expired']),
	amount: minorAmount,
	currency: z.string(),
	reference: z.string(),
	payment_id: paymentId.optional()
});

export const checkoutPaymentSchema = z.object({
	id: paymentId,
	amount: minorAmount,
	currency: z.string(),
	reference: z.string(),
	status: z.string(),
	balances: z.object({ total_captured: minorAmount, total_refunded: minorAmount })
});

export const checkoutRefundSchema = z.object({ action_id: z.string().min(1) });
export const checkoutActionsSchema = z
	.array(
		z.object({
			id: z.string(),
			type: z.string(),
			approved: z.boolean().optional()
		})
	)
	.max(151);

export const checkoutWebhookSchema = z.object({
	id: z.string().min(1).max(100),
	type: z.string(),
	data: z.object({
		id: z.string().optional(),
		reference: z.string().optional(),
		metadata: z.object({ fee_payment_id: z.string().optional() }).optional()
	})
});
