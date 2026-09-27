<script lang="ts">
	// SVELTEKIT IMPORTS
	import { page } from '$app/state';

	// COMPONENTS
	import Header from '@/components/ui/custom-components/header/header.svelte';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// UTILS
	import { deLocalizeUrl } from '@/lib/paraglide/runtime';

	let { children } = $props();
	const pathname = $derived(deLocalizeUrl(page.url).pathname);
	const isAuthPage = $derived(
		pathname === UNPROTECTED_PAGE_ENDPOINTS.SIGN_IN ||
			pathname === UNPROTECTED_PAGE_ENDPOINTS.SIGN_UP
	);
	const isSearchPage = $derived(pathname === UNPROTECTED_PAGE_ENDPOINTS.SEARCH);
</script>

{#if !isAuthPage && !isSearchPage}
	<Header />
{/if}
{@render children()}
