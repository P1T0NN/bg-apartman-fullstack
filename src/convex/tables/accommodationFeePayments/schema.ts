// LIBRARIES
import { defineTable } from 'convex/server';
import { v } from 'convex/values';
import { literals } from 'convex-helpers/validators';

export const accommodationFeePayments = defineTable({
	accommodationId: v.id('accommodations'),
	ownerId: v.string(),
	provider: v.string(),
	providerEnvironment: v.optional(v.string()),
	providerAccountId: v.optional(v.string()),
	terms: v.object({ amountMinor: v.number(), currency: v.string(), intervalMonths: v.number() }),
	status: literals(
		'creating',
		'pending',
		'processing',
		'paid',
		'expired',
		'failed',
		'refund_pending',
		'refunded'
	),
	createdAt: v.number(),
	expiresAt: v.number(),
	/** Only provider-confirmed closed, unpaid attempts become eligible for deletion. */
	closedAt: v.optional(v.number()),
	cleanupAt: v.optional(v.number()),
	nextReconcileAt: v.optional(v.number()),
	providerCheckoutId: v.optional(v.string()),
	checkoutUrl: v.optional(v.string()),
	checkoutRequestStartedAt: v.optional(v.number()),
	providerPaymentId: v.optional(v.string()),
	paidAt: v.optional(v.number()),
	billingPeriodEndsAt: v.optional(v.number()),
	/** False once billing is replaced; historical refunds must not revoke newer/admin periods. */
	entitlementApplied: v.boolean(),
	invalidated: v.boolean(),
	refundId: v.optional(v.string()),
	refundAmountMinor: v.optional(v.number()),
	refundAttempt: v.optional(v.number()),
	refundRequestedBy: v.optional(v.string()),
	refundStatus: v.optional(
		literals('pending', 'requires_action', 'succeeded', 'failed', 'canceled')
	),
	refundedAmountMinor: v.number(),
	updatedAt: v.number()
})
	.index('by_accommodation_id', ['accommodationId'])
	.index('by_provider_and_checkout_id', ['provider', 'providerCheckoutId'])
	.index('by_provider_and_payment_id', ['provider', 'providerPaymentId'])
	.index('by_cleanup_at', ['cleanupAt'])
	.index('by_provider_and_next_reconcile_at', ['provider', 'nextReconcileAt'])
	.index('by_next_reconcile_at', ['nextReconcileAt']);
