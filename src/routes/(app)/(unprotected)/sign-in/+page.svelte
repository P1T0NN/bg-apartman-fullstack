<script lang="ts">
	// COMPONENTS
	import Link from '@/components/ui/custom-components/link/link.svelte';
	import Logo from '@/components/ui/custom-components/logo/logo.svelte';
	import SignInForm from '@/features/auth/components/sign-in-form/sign-in-form.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';
</script>

<SvelteHead title="Sign in" noindex />

<div class="grid min-h-svh w-full lg:grid-cols-2">
	<main class="flex min-h-svh flex-col px-4 py-6 lg:p-10">
		<Link
			href={UNPROTECTED_PAGE_ENDPOINTS.ROOT}
			class="hidden items-center gap-2 font-medium lg:flex"
		>
			<Logo />
		</Link>

		<div class="flex flex-1 items-center justify-center py-2 lg:py-0">
			<SignInForm class="w-full max-w-sm lg:max-w-xs" splitLayout={true} />
		</div>
	</main>

	<aside class="relative hidden bg-muted lg:block" aria-hidden="true">
		<img
			src="/assets/belgrade-sunset.webp"
			alt=""
			class="absolute inset-0 h-full w-full object-cover"
		/>
		<div class="absolute inset-0 bg-black/60"></div>
	</aside>
</div>
