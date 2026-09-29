<script lang="ts">
	// COMPONENTS
	import SignUpForm from '@/features/auth/components/sign-up-form/sign-up-form.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';

	// CONFIG
	import { COMPANY_DATA } from '@/shared/config';
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';
</script>

<SvelteHead title="Sign up" noindex />

<div class="grid min-h-svh w-full lg:grid-cols-2">
	<main class="flex min-h-svh flex-col px-4 py-6 lg:p-10">
		<a href={UNPROTECTED_PAGE_ENDPOINTS.ROOT} class="hidden items-center gap-2 font-medium lg:flex">
			<span
				class="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground"
			>
				<span class="icon-[lucide--gallery-vertical-end] size-4" aria-hidden="true"></span>
			</span>
			{COMPANY_DATA.NAME}
		</a>

		<div class="flex flex-1 items-center justify-center py-2 lg:py-0">
			<SignUpForm class="w-full max-w-sm lg:max-w-xs" splitLayout={true} />
		</div>
	</main>

	<aside class="relative hidden bg-muted lg:block" aria-hidden="true">
		<img src="/login/login-image.webp" alt="" class="absolute inset-0 h-full w-full object-cover" />
		<div class="absolute inset-0 bg-black/60"></div>
	</aside>
</div>
