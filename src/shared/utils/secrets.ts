/** Encode cryptographic bytes as lowercase hexadecimal. */
function hex(bytes: Uint8Array): string {
	return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** Generate a 256-bit credential. In Convex, call from actions, never mutations or queries. */
export function createSecret(): string {
	return hex(crypto.getRandomValues(new Uint8Array(32)));
}

/** Hash a credential for storage without retaining its raw value. */
export async function hashSecret(secret: string): Promise<string> {
	return hex(
		new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret)))
	);
}
