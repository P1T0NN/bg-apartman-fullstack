export const STRIPE_CONFIG = {
	checkoutExpiresInMs: 60 * 60 * 1000,
	minimumCheckoutLifetimeMs: 30 * 60 * 1000,
	millisecondsPerSecond: 1000,
	minimumEurChargeMinor: 50,
	checkoutRequestLimit: { kind: 'fixed window', rate: 5, capacity: 5, period: 60 * 1000 },
	checkoutCreationLimit: {
		kind: 'fixed window',
		rate: 10,
		capacity: 10,
		period: 24 * 60 * 60 * 1000
	},
	maintenanceIntervalMinutes: 15,
	reconciliationRetryMs: 15 * 60 * 1000,
	unpaidAttemptRetentionMs: 7 * 24 * 60 * 60 * 1000,
	webhookEventRetentionMs: 30 * 24 * 60 * 60 * 1000,
	maintenanceBatchSize: 50,
	checkoutLookupPageSize: 100,
	checkoutLookupMaxPages: 3,
	checkoutLookupClockSkewSeconds: 60,
	webhookEndpointPageSize: 100,
	maxWebhookPayloadLength: 1024 * 1024,
	integrationIdentifierSuffixLength: 8,
	feePaymentPurpose: 'accommodation_flat_fee',
	webhookPath: '/stripe-webhook',
	testKeyPattern: /^[sr]k_test_/,
	liveKeyPattern: /^[sr]k_live_/,
	feeWebhookEvents: [
		'checkout.session.completed',
		'checkout.session.async_payment_succeeded',
		'checkout.session.async_payment_failed',
		'checkout.session.expired',
		'refund.created',
		'refund.updated',
		'refund.failed',
		'charge.refunded'
	]
} as const;
