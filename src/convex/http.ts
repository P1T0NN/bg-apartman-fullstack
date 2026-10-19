// LIBRARIES
import { httpRouter } from 'convex/server';

// CONVEX
import { httpAction } from './_generated/server.js';

// AUTH
import { authComponent, createAuth } from './betterAuth/config.js';

// EMAILS
import { resend } from './emails/sendEmail.js';

// PAYMENTS
import { checkoutWebhook } from './checkout/checkoutWebhook.js';

const http = httpRouter();

http.route({ path: '/checkout-webhook', method: 'POST', handler: checkoutWebhook });

http.route({
	path: '/resend-webhook',
	method: 'POST',
	handler: httpAction((ctx, request) => resend.handleResendEventWebhook(ctx, request))
});

authComponent.registerRoutes(http, createAuth);

export default http;
