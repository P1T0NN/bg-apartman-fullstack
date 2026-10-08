// LIBRARIES
import { ConvexError, v } from 'convex/values';
import { internalMutation } from '../../../_generated/server.js';
import { internal } from '../../../_generated/api.js';

// CONFIG
import { STRIPE_CONFIG } from '../../../../shared/features/stripe/config.js';

// HELPERS
import { getLatestFeePayment } from '../helpers/getLatestFeePayment.js';
import { requireIdentity, getOwnerId } from '../../../betterAuth/helpers/requireIdentity.js';

// RATE LIMITS
import { limitFeeCheckoutCreation } from '../ratelimiting/accommodationFeePaymentRateLimits.js';

// VALIDATORS
import { feePaymentDoc } from '../validators/accommodationFeePaymentsValidators.js';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';
import type { Doc } from '../../../_generated/dataModel.js';

export const beginFeeCheckout = internalMutation({
	args: { accommodationId: v.id('accommodations') },
	returns: feePaymentDoc,
	handler: async (ctx, { accommodationId }): Promise<Doc<'accommodationFeePayments'>> => {
		const identity = await requireIdentity(ctx);

		const accommodation = await ctx.db.get('accommodations', accommodationId);

		const isOwnedAccommodation = accommodation && accommodation.ownerId === getOwnerId(identity);

		if (!isOwnedAccommodation) throw new ConvexError<BackendErrorData>({ code: 'FORBIDDEN' });

		if (accommodation.status === 'deleted')
			throw new ConvexError<BackendErrorData>({ code: 'ACCOMMODATION_NOT_FOUND' });

		const now = Date.now();

		const isPaid =
			accommodation.billingStatus === 'active' &&
			accommodation.billingPeriodEndsAt !== null &&
			accommodation.billingPeriodEndsAt > now;

		const billingTerms = accommodation.billingTerms;

		const canBuyFlatFeePeriod =
			accommodation.billingPlanId === 'flat_fee' && billingTerms.model === 'flat_fee' && !isPaid;

		if (!canBuyFlatFeePeriod)
			throw new ConvexError<BackendErrorData>({ code: 'ACCOMMODATION_BILLING_PLAN_CHANGED' });

		const { amountMinor, currency, intervalMonths } = billingTerms;

		const validTerms =
			Number.isSafeInteger(amountMinor) &&
			amountMinor >= STRIPE_CONFIG.minimumEurChargeMinor &&
			currency === 'EUR' &&
			Number.isSafeInteger(intervalMonths) &&
			intervalMonths > 0;

		if (!validTerms) throw new ConvexError<BackendErrorData>({ code: 'INVALID_ACCOMMODATION' });

		const latest = await getLatestFeePayment(ctx, accommodationId);
		const hasUnresolvedCheckout =
			latest &&
			latest.checkoutSessionId &&
			!latest.closedAt &&
			latest.status !== 'paid' &&
			latest.status !== 'refunded';
		if (hasUnresolvedCheckout) return latest;

		const hasReusableAttempt =
			latest &&
			!latest.invalidated &&
			(latest.status === 'creating' ||
				latest.status === 'pending' ||
				latest.status === 'processing');

		if (hasReusableAttempt) {
			// Stripe requires at least 30 minutes remaining when a session is first created.
			const needsSessionCreation = latest.status === 'creating' && !latest.checkoutSessionId;

			const usableDeadline = needsSessionCreation
				? latest.expiresAt - STRIPE_CONFIG.minimumCheckoutLifetimeMs
				: latest.expiresAt;

			const canResumeAttempt = latest.status === 'processing' || usableDeadline > now;

			if (canResumeAttempt) return latest;

			await ctx.db.patch('accommodationFeePayments', latest._id, {
				status: 'expired',
				invalidated: true,
				updatedAt: now
			});
		}

		const expiresAt = now + STRIPE_CONFIG.checkoutExpiresInMs;
		await limitFeeCheckoutCreation(ctx, getOwnerId(identity));
		const id = await ctx.db.insert('accommodationFeePayments', {
			accommodationId,
			ownerId: getOwnerId(identity),
			terms: { amountMinor, currency, intervalMonths },
			status: 'creating',
			createdAt: now,
			expiresAt,
			nextReconcileAt: expiresAt,
			entitlementApplied: false,
			invalidated: false,
			refundedAmountMinor: 0,
			updatedAt: now
		});

		await ctx.scheduler.runAt(
			expiresAt,
			internal.stripe.actions.reconcileFeeCheckout.reconcileFeeCheckout,
			{ paymentId: id, expire: true }
		);

		const payment = await ctx.db.get('accommodationFeePayments', id);

		if (!payment) throw new Error('Payment attempt was not saved');

		return payment;
	}
});
