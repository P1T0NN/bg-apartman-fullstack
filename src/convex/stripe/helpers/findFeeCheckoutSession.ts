// CONFIG
import { STRIPE_CONFIG } from '../../../shared/features/stripe/config.js';

// HELPERS
import { getStripe } from './getStripe.js';

// TYPES
import type { Doc } from '../../_generated/dataModel.js';
import type { StripeCheckoutSession } from '../../../shared/features/stripe/types/stripeTypes.js';

/** Recover a session when Stripe created it but the action lost the response. */
export async function findFeeCheckoutSession(
	payment: Doc<'accommodationFeePayments'>
): Promise<StripeCheckoutSession | null> {
	const stripe = getStripe();
	let cursor: string | undefined;
	for (let page = 0; page < STRIPE_CONFIG.checkoutLookupMaxPages; page++) {
		const sessions = await stripe.checkout.sessions.list({
			created: {
				gte:
					Math.floor(payment.createdAt / STRIPE_CONFIG.millisecondsPerSecond) -
					STRIPE_CONFIG.checkoutLookupClockSkewSeconds,
				lte:
					Math.ceil(payment.expiresAt / STRIPE_CONFIG.millisecondsPerSecond) +
					STRIPE_CONFIG.checkoutLookupClockSkewSeconds
			},
			limit: STRIPE_CONFIG.checkoutLookupPageSize,
			starting_after: cursor
		});
		const match = sessions.data.find(
			(session) =>
				session.client_reference_id === payment._id &&
				session.metadata?.purpose === STRIPE_CONFIG.feePaymentPurpose
		);
		if (match) return match;
		if (!sessions.has_more) return null;
		cursor = sessions.data.at(-1)?.id;
	}
	// ponytail: keep unresolved receipts if this account outgrows the bounded recovery search.
	throw new Error('Checkout recovery needs more provider pages');
}
