// LIBRARIES
import { defineTable } from 'convex/server';
import { v } from 'convex/values';

/** Expected and verified online payment splits; never invoices to the host. */
export const bookingFeePayments = defineTable({
	bookingId: v.id('bookings'),
	accommodationId: v.id('accommodations'),
	hostId: v.string(),
	amountMinor: v.number(),
	grossAmountMinor: v.number(),
	hostAmountMinor: v.number(),
	pendingOnlineSplit: v.boolean(),
	currency: v.string(),
	accruedAt: v.number(),
	paidAt: v.optional(v.number()),
	provider: v.optional(v.string()),
	providerPaymentId: v.optional(v.string()),
	refundedAmountMinor: v.number()
})
	.index('by_booking_id', ['bookingId'])
	.index('by_provider_and_provider_payment_id', ['provider', 'providerPaymentId']);
