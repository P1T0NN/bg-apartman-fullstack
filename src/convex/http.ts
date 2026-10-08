// LIBRARIES
import { httpRouter } from 'convex/server';

// CONVEX
import { httpAction } from './_generated/server.js';
import { internal } from './_generated/api.js';

// CONFIG
import { STRIPE_CONFIG } from '../shared/features/stripe/config.js';

// AUTH
import { authComponent, createAuth } from './betterAuth/config.js';

// EMAILS
import { resend } from './emails/sendEmail.js';

const http = httpRouter();

http.route({
	path: STRIPE_CONFIG.webhookPath,
	method: 'POST',
	handler: httpAction(async (ctx, request) => {
		const signature = request.headers.get('stripe-signature');
		if (!signature) return new Response('Missing signature', { status: 400 });
		const payload = await request.text();
		if (payload.length > STRIPE_CONFIG.maxWebhookPayloadLength)
			return new Response('Payload too large', { status: 413 });
		try {
			const valid = await ctx.runAction(
				internal.stripe.actions.handleStripeWebhook.handleStripeWebhook,
				{ payload, signature }
			);
			return new Response(valid ? 'OK' : 'Invalid signature or mode', {
				status: valid ? 200 : 400
			});
		} catch {
			// Provider retries are required if payment persistence or refund processing failed.
			return new Response('Payment event processing failed', { status: 500 });
		}
	})
});

http.route({
	path: '/resend-webhook',
	method: 'POST',
	handler: httpAction((ctx, request) => resend.handleResendEventWebhook(ctx, request))
});

authComponent.registerRoutes(http, createAuth);

export default http;
