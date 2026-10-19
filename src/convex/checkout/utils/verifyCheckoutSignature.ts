export async function verifyCheckoutSignature(
	body: ArrayBuffer,
	signature: string | null,
	secret: string
): Promise<boolean> {
	if (!signature || !/^[a-fA-F0-9]{64}$/.test(signature)) return false;
	const key = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['verify']
	);
	const bytes = Uint8Array.from(signature.match(/../g) ?? [], (pair) => Number.parseInt(pair, 16));
	return crypto.subtle.verify('HMAC', key, bytes, body);
}
