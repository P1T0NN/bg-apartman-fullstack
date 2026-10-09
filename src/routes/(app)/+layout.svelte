<script lang="ts">
	// SVELTEKIT IMPORTS
	import { page } from '$app/state';

	// COMPONENTS
	import Header from '@/components/ui/custom-components/header/header.svelte';
	import HeaderAnnouncement from '@/components/ui/custom-components/header/header-announcement.svelte';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';
	import { LOYALTY_CONFIG } from '@/shared/features/loyalty/config.js';

	// UTILS
	import { deLocalizeUrl } from '@/lib/paraglide/runtime';

	let { children } = $props();
	const pathname = $derived(deLocalizeUrl(page.url).pathname);
	const isAuthPage = $derived(
		pathname === UNPROTECTED_PAGE_ENDPOINTS.SIGN_IN ||
			pathname === UNPROTECTED_PAGE_ENDPOINTS.SIGN_UP
	);
	const isSearchPage = $derived(pathname === UNPROTECTED_PAGE_ENDPOINTS.SEARCH);
	const announcementExcludedPaths = [
		UNPROTECTED_PAGE_ENDPOINTS.SIGN_IN,
		UNPROTECTED_PAGE_ENDPOINTS.SIGN_UP,
		UNPROTECTED_PAGE_ENDPOINTS.FORGOT_PASSWORD,
		UNPROTECTED_PAGE_ENDPOINTS.VERIFY_EMAIL,
		UNPROTECTED_PAGE_ENDPOINTS.AUTH_ERROR
	];
	const isAnnouncementExcluded = $derived(
		announcementExcludedPaths.some((path) => pathname === path) ||
			page.route.id === '/(app)/(unprotected)/accommodation/[id]/book' ||
			page.route.id === '/(app)/(unprotected)/book-confirmation/[id]'
	);
</script>

{#if LOYALTY_CONFIG.BOOKING_ENABLED && !isAnnouncementExcluded}
	<HeaderAnnouncement />
{/if}
{#if !isAuthPage && !isSearchPage}
	<Header />
{/if}
{@render children()}
