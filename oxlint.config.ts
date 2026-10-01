// LIBRARIES
import convexPlugin from '@convex-dev/eslint-plugin';
import { defineConfig } from 'oxlint';

export default defineConfig({
	ignorePatterns: [
		'.agent/**',
		'.agents/**',
		'.claude/**',
		'.codex/**',
		'.continue/**',
		'.cursor/**',
		'.gemini/**',
		'.opencode/**',
		'.pi/**',
		'.roo/**',
		'.windsurf/**',
		'src/convex/_generated/**',
		'src/convex/betterAuth/component/_generated/**',
		'src/convex/betterAuth/component/generatedSchema.ts',
		'tools/oxlint/anti-slop/**'
	],
	jsPlugins: [
		{ name: '@convex-dev', specifier: '@convex-dev/eslint-plugin' },
		{ name: 'anti-slop', specifier: './tools/oxlint/anti-slop/index.ts' },
		{
			name: 'anti-slop-effect',
			specifier: './tools/oxlint/anti-slop/effect/index.ts'
		}
	],
	rules: {
		'anti-slop/no-chained-type-assertions': 'error',
		'anti-slop/no-conditional-empty-object-spread': 'error',
		'anti-slop/no-known-value-widening': 'error',
		'anti-slop/no-module-mocking': 'error',
		'anti-slop/no-object-parameters': 'error',
		'anti-slop/no-reflect-apply': 'error',
		'anti-slop/no-reflect-get': 'error',
		'anti-slop/no-runtime-typeof': 'error',
		'anti-slop/no-shape-in-symbol-names': 'error',
		'anti-slop/no-unknown-parameters': 'error',
		'anti-slop/no-unknown-returns': 'error',
		'anti-slop/no-unknown-type-aliases': 'error',
		'anti-slop/no-unsafe-dictionary-type': 'error',
		'anti-slop/no-widen-then-assert': 'error',
		'anti-slop/require-safety-comment-for-type-assertion': 'error',
		'anti-slop-effect/no-service-constructor-imports': 'error'
	},
	overrides: [
		{
			files: ['src/convex/**/*.ts'],
			rules: convexPlugin.configs.recommended[0].rules
		}
	]
});
