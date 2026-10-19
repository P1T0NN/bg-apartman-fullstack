// LIBRARIES
import { ConvexError, v } from 'convex/values';

// BUILDERS
import { authenticatedAction } from '../../../builders/convexFunctionBuilders.js';

// CONVEX
import { internal } from '../../../_generated/api.js';

// CONFIG
import { CHECKOUT_CONFIG } from '../../../../shared/features/checkout/config.js';

// SCHEMAS
import { hostedCheckoutSchema } from '../../../../shared/features/checkout/schemas/checkoutSchemas.js';

// HELPERS
import { checkoutRequest } from '../../../checkout/helpers/checkoutRequest.js';
import { getCheckoutConfig } from '../../../checkout/helpers/getCheckoutConfig.js';

// UTILS
import { validateCheckoutUrl } from '../../../../shared/features/checkout/utils/validateCheckoutUrl.js';

// ERRORS
import { CheckoutApiError } from '../../../checkout/errors/CheckoutApiError.js';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';

export const createFeeCheckout = authenticatedAction({
	args: { accommodationId: v.id('accommodations') },
	returns: v.object({ url: v.string() }),
	handler: async (ctx, { accommodationId }): Promise<{ url: string }> => {
		const { channelId } = getCheckoutConfig();
		const origin = process.env.PUBLIC_ORIGIN;
		if (!origin) throw new Error('Application origin is not configured');
		const payment = await ctx.runMutation(
			internal.tables.accommodationFeePayments.mutations.beginFeeCheckout.beginFeeCheckout,
			{
				accommodationId,
				provider: 'checkout',
				providerEnvironment: 'sandbox',
				providerAccountId: channelId
			}
		);
		if (payment.checkoutUrl && payment.providerCheckoutId) {
			return { url: validateCheckoutUrl(payment.checkoutUrl) };
		}
		const claimed = await ctx.runMutation(
			internal.tables.accommodationFeePayments.mutations.claimFeeCheckout.claimFeeCheckout,
			{ paymentId: payment._id }
		);
		if (!claimed) throw new ConvexError<BackendErrorData>({ code: 'FEE_CHECKOUT_PENDING' });
		const resultUrl = new URL('/host/accommodation-payment-successful', origin);
		resultUrl.searchParams.set('fee_payment', payment._id);
		const cancelUrl = new URL(`/host/my-accommodations/${accommodationId}`, origin);
		cancelUrl.searchParams.set('tab', 'billing');
		cancelUrl.searchParams.set('fee_checkout', 'cancelled');
		cancelUrl.searchParams.set('fee_payment', payment._id);
		let checkout;
		try {
			checkout = await checkoutRequest('/hosted-payments', hostedCheckoutSchema, {
				method: 'POST',
				body: JSON.stringify({
					amount: payment.terms.amountMinor,
					currency: payment.terms.currency,
					reference: payment._id,
					metadata: { fee_payment_id: payment._id },
					processing_channel_id: channelId,
					capture: true,
					'3ds': { enabled: true },
					allow_payment_methods: ['card'],
					// shortcut: Sandbox defaults to RS; collect the host's billing country before live payments.
					billing: { address: { country: CHECKOUT_CONFIG.sandboxBillingCountry } },
					success_url: resultUrl.href,
					failure_url: resultUrl.href,
					cancel_url: cancelUrl.href
				})
			});
		} catch (error) {
			const creationRejected =
				error instanceof CheckoutApiError && [400, 401, 403, 422].includes(error.status);
			if (creationRejected)
				await ctx.runMutation(
					internal.tables.accommodationFeePayments.mutations.saveFeeReconciliation
						.saveFeeReconciliation,
					{ paymentId: payment._id, retry: false, creationRejected: true }
				);
			throw error;
		}
		const url = validateCheckoutUrl(checkout._links.redirect.href);
		await ctx.runMutation(
			internal.tables.accommodationFeePayments.mutations.saveFeeCheckout.saveFeeCheckout,
			{ paymentId: payment._id, provider: 'checkout', providerCheckoutId: checkout.id, url }
		);
		const current = await ctx.runQuery(
			internal.tables.accommodationFeePayments.queries.fetchFeePayment.fetchFeePayment,
			{ paymentId: payment._id }
		);
		if (!current || current.invalidated)
			throw new ConvexError<BackendErrorData>({ code: 'FEE_CHECKOUT_EXPIRED' });
		return { url };
	}
});
