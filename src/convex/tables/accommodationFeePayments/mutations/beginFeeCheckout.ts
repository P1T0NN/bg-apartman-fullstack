// LIBRARIES
import { ConvexError, v } from 'convex/values';
import { internalMutation } from '../../../_generated/server.js';

// CONFIG
import { PAYMENTS_CONFIG } from '../../../../shared/features/payments/config.js';

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
	args: {
		accommodationId: v.id('accommodations'),
		provider: v.string(),
		providerEnvironment: v.optional(v.string()),
		providerAccountId: v.optional(v.string())
	},
	returns: feePaymentDoc,
	handler: async (
		ctx,
		{ accommodationId, provider, providerEnvironment, providerAccountId }
	): Promise<Doc<'accommodationFeePayments'>> => {
		if (!provider.trim()) throw new Error('Payment provider is required');
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
			amountMinor > 0 &&
			currency === 'EUR' &&
			Number.isSafeInteger(intervalMonths) &&
			intervalMonths > 0;

		if (!validTerms) throw new ConvexError<BackendErrorData>({ code: 'INVALID_ACCOMMODATION' });

		const latest = await getLatestFeePayment(ctx, accommodationId);
		const hasUnresolvedCheckout =
			latest &&
			latest.providerCheckoutId &&
			!latest.closedAt &&
			latest.status !== 'paid' &&
			latest.status !== 'refunded';

		const hasReusableAttempt =
			latest &&
			!latest.invalidated &&
			(latest.status === 'creating' ||
				latest.status === 'pending' ||
				latest.status === 'processing');
		const hasDifferentProvider =
			(hasUnresolvedCheckout || hasReusableAttempt) &&
			(latest.provider !== provider ||
				latest.providerEnvironment !== providerEnvironment ||
				latest.providerAccountId !== providerAccountId);
		if (hasDifferentProvider) throw new Error('An unresolved payment uses another provider');
		if (hasUnresolvedCheckout) return latest;

		if (hasReusableAttempt) {
			const canResumeAttempt = latest.status === 'processing' || latest.expiresAt > now;

			if (canResumeAttempt) return latest;

			await ctx.db.patch('accommodationFeePayments', latest._id, {
				status: 'expired',
				invalidated: true,
				updatedAt: now
			});
		}

		const expiresAt = now + PAYMENTS_CONFIG.checkoutExpiresInMs;
		await limitFeeCheckoutCreation(ctx, getOwnerId(identity));
		const id = await ctx.db.insert('accommodationFeePayments', {
			accommodationId,
			ownerId: getOwnerId(identity),
			provider,
			providerEnvironment,
			providerAccountId,
			terms: { amountMinor, currency, intervalMonths },
			status: 'creating',
			createdAt: now,
			expiresAt,
			entitlementApplied: false,
			invalidated: false,
			refundedAmountMinor: 0,
			updatedAt: now
		});

		const payment = await ctx.db.get('accommodationFeePayments', id);

		if (!payment) throw new Error('Payment attempt was not saved');

		return payment;
	}
});
