export class CheckoutApiError extends Error {
	constructor(readonly status: number) {
		super(`Checkout.com request failed (HTTP ${status})`);
	}
}
