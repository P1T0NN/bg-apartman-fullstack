// TYPES
import type { z } from 'zod';
import type Stripe from 'stripe';
import type { stripeObjectIdSchema } from '../schemas/stripeSchemas.js';

export type StripeObjectIdInput = z.input<typeof stripeObjectIdSchema>;
export type StripeCheckoutSession = Stripe.Checkout.Session;
export type StripeEvent = Stripe.Event;
export type StripeWebhookEvent = Pick<StripeEvent, 'id' | 'type'>;
