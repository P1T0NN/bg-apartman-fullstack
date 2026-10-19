export const PAYMENTS_CONFIG = {
	checkoutExpiresInMs: 60 * 60 * 1000,
	reconcileIntervalMs: 60 * 1000,
	checkoutCreationLimit: {
		kind: 'fixed window',
		rate: 10,
		capacity: 10,
		period: 24 * 60 * 60 * 1000
	}
} as const;
