// CONFIG
import { STRIPE_CONFIG } from '../../../shared/features/stripe/config.js';

// HELPERS
import { getStripe } from './getStripe.js';

// TYPES
import type { Doc } from '../../_generated/dataModel.js';

export function createFeeCheckoutSession(payment: Doc<'accommodationFeePayments'>) {
	const stripe = getStripe();

	const origin = process.env.PUBLIC_ORIGIN;

	if (!origin) throw new Error('Missing PUBLIC_ORIGIN');

	const returnUrl = new URL(
		`/host/my-accommodations/${payment.accommodationId}?tab=billing`,
		origin
	);
	const successUrl = new URL('/host/accommodation-payment-successful', origin);
	successUrl.searchParams.set('fee_payment', payment._id);

	return stripe.checkout.sessions.create(
		{
			mode: 'payment',
			client_reference_id: payment._id,
			metadata: { purpose: STRIPE_CONFIG.feePaymentPurpose, paymentId: payment._id },
			payment_intent_data: {
				metadata: { purpose: STRIPE_CONFIG.feePaymentPurpose, paymentId: payment._id }
			},
			line_items: [
				{
					quantity: 1,
					price_data: {
						currency: payment.terms.currency.toLowerCase(),
						unit_amount: payment.terms.amountMinor,
						product_data: {
							name: `Accommodation listing fee (${payment.terms.intervalMonths} months)`
						}
					}
				}
			],
			expires_at: Math.floor(payment.expiresAt / STRIPE_CONFIG.millisecondsPerSecond),
			success_url: successUrl.toString(),
			cancel_url: `${returnUrl}&fee_checkout=cancelled`,
			integration_identifier: `bgapartman_flat_fee_${payment._id.slice(-STRIPE_CONFIG.integrationIdentifierSuffixLength).replace(/[^a-z]/g, 'a')}`
		},
		{ idempotencyKey: `accommodation-fee-checkout:${payment._id}` }
	);
}
