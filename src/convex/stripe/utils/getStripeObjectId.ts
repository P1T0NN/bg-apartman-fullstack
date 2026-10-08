// SCHEMAS
import { stripeObjectIdSchema } from '../../../shared/features/stripe/schemas/stripeSchemas.js';

// TYPES
import type { StripeObjectIdInput } from '../../../shared/features/stripe/types/stripeTypes.js';

/** Stripe references can be IDs or expanded objects; validate and normalize at the provider boundary. */
export function getStripeObjectId(value: StripeObjectIdInput) {
	return stripeObjectIdSchema.parse(value);
}
