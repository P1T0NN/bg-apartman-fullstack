export const CHECKOUT_CONFIG = {
	requestTimeoutMs: 15000,
	webhookEventLifetimeMs: 7 * 24 * 60 * 60 * 1000,
	reconciliationBatchSize: 25,
	webhookCleanupBatchSize: 100,
	sandboxBillingCountry: 'RS'
} as const;
