import { paraglideVitePlugin } from '@inlang/paraglide-js';
import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-auto';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';
import type { Config } from '@sveltejs/kit';

type CspDirectives = NonNullable<NonNullable<NonNullable<Config['kit']>['csp']>['directives']>;

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), 'PUBLIC_');
	const convexUrl = new URL(env.PUBLIC_CONVEX_URL);
	if (convexUrl.protocol !== 'http:' && convexUrl.protocol !== 'https:') {
		throw new Error('PUBLIC_CONVEX_URL must be an HTTP or HTTPS URL.');
	}
	// SAFETY: parsed HTTP(S) and corresponding WebSocket origins are valid CSP host sources.
	const convexSources = [convexUrl.origin, convexUrl.origin.replace(/^http/, 'ws')] as NonNullable<
		CspDirectives['connect-src']
	>;

	return {
		plugins: [
			paraglideVitePlugin({
				project: './project.inlang',
				outdir: './src/lib/paraglide',
				emitTsDeclarations: true,
				strategy: ['url', 'baseLocale'],
				routeStrategies: [
					{ match: '/admin/:path(.*)?', strategy: ['cookie', 'baseLocale'] },
					{ match: '/host/:path(.*)?', strategy: ['cookie', 'baseLocale'] },
					{ match: '/guest/:path(.*)?', strategy: ['cookie', 'baseLocale'] },
					{ match: '/tests/data-:path(.*)?', strategy: ['cookie', 'baseLocale'] },
					{ match: '/api/:path(.*)?', exclude: true }
				],
				urlPatterns: [
					{
						pattern: ':protocol://:domain(.*)::port?/:path(.*)?',
						localized: [['en', ':protocol://:domain(.*)::port?/en/:path(.*)?']]
					}
				]
			}),
			tailwindcss(),
			sveltekit({
				csp: {
					mode: 'auto',
					directives: {
						'default-src': ['self'],
						// shortcut: Google Maps requires unsafe-eval; remove when its API no longer needs it.
						'script-src': [
							'self',
							'unsafe-eval',
							'https://challenges.cloudflare.com',
							'https://maps.googleapis.com',
							'https://maps.gstatic.com'
						],
						// Svelte buffers image load/error events before hydration with this.__e=event.
						'script-src-attr': [
							'unsafe-hashes',
							'sha256-7dQwUgLau1NFCCGjfn9FsYptB6ZtWxJin6VohGIu20I='
						],
						// shortcut: Maps and UI libraries inject inline CSS; tighten when they support nonces.
						'style-src': ['self', 'unsafe-inline', 'https://fonts.googleapis.com'],
						// Listings and profile images may use external HTTPS URLs, including seeded photos.
						'img-src': ['self', 'https:', 'data:', 'blob:'],
						'font-src': ['self', 'https://fonts.gstatic.com'],
						'connect-src': [
							'self',
							...convexSources,
							'https://*.r2.cloudflarestorage.com',
							'https://*.googleapis.com',
							'https://*.gstatic.com',
							'https://*.google.com',
							'data:',
							'blob:'
						],
						'frame-src': ['https://challenges.cloudflare.com', 'https://*.google.com'],
						'worker-src': ['self', 'blob:'],
						'object-src': ['none'],
						'base-uri': ['none'],
						'form-action': ['self'],
						'frame-ancestors': ['none']
					}
				},
				compilerOptions: {
					// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
					runes: ({ filename }) =>
						filename.split(/[/\\]/).includes('node_modules') ? undefined : true,

					experimental: {
						async: true
					}
				},

				alias: {
					'@': './src',
					'@convex': './src/convex'
				},

				experimental: {
					remoteFunctions: true
				},

				// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
				// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
				// See https://svelte.dev/docs/kit/adapters for more information about adapters.
				adapter: adapter()
			})
		],

		// preview serves on the same port as dev — keep the muscle memory.
		preview: {
			port: 5173,
			strictPort: true
		}
	};
});
