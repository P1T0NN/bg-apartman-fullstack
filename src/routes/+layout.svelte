<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	// LIBRARIES
	import { createSvelteAuthClient } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { authClient } from '@/features/auth/lib/authClient';

	// COMPONENTS
	import { Toaster } from '@/components/ui/sonner/index.js';

	// HOOKS
	import { useAnalyticsLocal } from '@/features/analytics/hooks/useAnalyticsLocal.svelte.js';

	let { children, data } = $props();

	createSvelteAuthClient({
		authClient,
		getServerState: () => data.authState
	});

	// One eager client id per browser; no component needs to own it.
	useAnalyticsLocal();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

{@render children()}
<Toaster richColors />
