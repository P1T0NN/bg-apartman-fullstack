import assert from 'node:assert/strict';

const origin = new URL(process.argv[2] ?? 'http://127.0.0.1:5173').origin;

function checkHeaders(response: Response): void {
	assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
	assert.equal(response.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
	assert.equal(response.headers.get('x-frame-options'), 'DENY');
	assert.equal(
		response.headers.get('permissions-policy'),
		'camera=(), microphone=(), geolocation=()'
	);
	assert.equal(
		response.headers.get('strict-transport-security'),
		origin.startsWith('https:') ? 'max-age=31536000' : null
	);
}

const nonces = new Set<string>();
for (const path of ['/en', '/en/search', '/en/sign-in', '/en']) {
	const response = await fetch(new URL(path, origin));
	assert.equal(response.status, 200, path);
	checkHeaders(response);
	const policy = response.headers.get('content-security-policy');
	assert.ok(policy, `Missing CSP on ${path}`);
	for (const directive of [
		"default-src 'self'",
		"script-src-attr 'unsafe-hashes' 'sha256-7dQwUgLau1NFCCGjfn9FsYptB6ZtWxJin6VohGIu20I='",
		"object-src 'none'",
		"base-uri 'none'",
		"form-action 'self'",
		"frame-ancestors 'none'"
	]) {
		assert.ok(policy.includes(directive), `Missing ${directive}`);
	}
	const scriptPolicy = policy
		.split(';')
		.find((directive) => directive.trim().startsWith('script-src '));
	assert.ok(scriptPolicy);
	assert.ok(!scriptPolicy.includes("'unsafe-inline'"));
	const nonce = scriptPolicy.match(/'nonce-([^']+)'/)?.[1];
	assert.ok(nonce, `Missing script nonce on ${path}`);
	assert.ok(!nonces.has(nonce), 'Nonce reused between responses');
	nonces.add(nonce);
	const html = await response.text();
	assert.ok(!html.includes('%sveltekit.nonce%'), 'Unexpanded nonce placeholder');
	const turnstileScript = html.match(
		/<script\b[^>]*src="https:\/\/challenges\.cloudflare\.com[^>]*>/
	)?.[0];
	assert.ok(turnstileScript?.includes(`nonce="${nonce}"`), 'Turnstile nonce does not match CSP');
}

const privateResponse = await fetch(new URL('/en', origin), {
	headers: { Authorization: 'Bearer security-check' }
});
checkHeaders(privateResponse);
assert.equal(privateResponse.headers.get('cache-control'), 'private, no-store');
await privateResponse.body?.cancel();

const redirect = await fetch(new URL('/host/dashboard', origin), { redirect: 'manual' });
assert.ok(redirect.status >= 300 && redirect.status < 400);
assert.ok(redirect.headers.get('location'));
checkHeaders(redirect);
await redirect.body?.cancel();

// This invalid cross-origin form must be rejected before the API handler runs.
const crossOrigin = await fetch(new URL('/api/places/autocomplete', origin), {
	method: 'POST',
	headers: { Origin: 'https://untrusted.example', 'Content-Type': 'text/plain' },
	body: 'security-check'
});
assert.equal(crossOrigin.status, 403, await crossOrigin.text());

console.log('Security checks passed: headers, CSP nonces, private caching, redirects and CSRF.');
