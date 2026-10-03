// LIBRARIES
import { httpRouter } from 'convex/server';
import { authComponent, createAuth } from './betterAuth/config.js';

import { httpAction } from './_generated/server.js';
import { resend } from './emails/sendEmail.js';

const http = httpRouter();

http.route({
	path: '/resend-webhook',
	method: 'POST',
	handler: httpAction((ctx, request) => resend.handleResendEventWebhook(ctx, request))
});

authComponent.registerRoutes(http, createAuth);

export default http;
