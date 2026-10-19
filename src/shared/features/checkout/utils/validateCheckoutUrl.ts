export function validateCheckoutUrl(value: string): string {
	const url = new URL(value);
	const isSandboxCheckout =
		url.protocol === 'https:' &&
		url.host === 'pay.sandbox.checkout.com' &&
		!url.username &&
		!url.password;
	if (!isSandboxCheckout) throw new Error('Unexpected Checkout.com redirect URL');
	return url.href;
}
