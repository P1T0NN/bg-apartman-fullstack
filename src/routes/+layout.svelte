<script lang="ts">
	import './layout.css';

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

<svelte:head>
	<link rel="icon" type="image/webp" href="/logo/opt/logo-transparent-411w.webp" />
</svelte:head>

{@render children()}
<Toaster richColors />
