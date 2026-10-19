// CONVEX
import { env, httpAction } from '../_generated/server.js';
import { internal } from '../_generated/api.js';

// SCHEMAS
import { checkoutWebhookSchema } from '../../shared/features/checkout/schemas/checkoutSchemas.js';

// UTILS
import { verifyCheckoutSignature } from './utils/verifyCheckoutSignature.js';

export const checkoutWebhook = httpAction(async (ctx, request) => {
	const secret = env.CHECKOUT_WEBHOOK_SECRET;
	if (!secret) return new Response('Webhook is not configured', { status: 503 });
	const body = await request.arrayBuffer();
	if (!(await verifyCheckoutSignature(body, request.headers.get('Cko-Signature'), secret)))
		return new Response('Invalid signature', { status: 401 });
	let payload;
	try {
		payload = checkoutWebhookSchema.safeParse(JSON.parse(new TextDecoder().decode(body)));
	} catch {
		return new Response('Invalid payload', { status: 400 });
	}
	if (!payload.success) return new Response('Invalid payload', { status: 400 });
	const event = payload.data;
	const reference = event.data.metadata?.fee_payment_id ?? event.data.reference;
	if (event.type.startsWith('payment_')) {
		await ctx.runMutation(internal.checkout.mutations.queueWebhook.queueWebhook, {
			eventId: event.id,
			reference,
			providerPaymentId: event.data.id
		});
	}
	return new Response(null, { status: 200 });
});
