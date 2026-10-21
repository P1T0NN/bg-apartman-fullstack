<script lang="ts">
	// LIBRARIES
	import { authClient } from '@/features/auth/lib/authClient';

	// COMPONENTS
	import HeaderMobile from '@/components/ui/custom-components/header/header-mobile.svelte';
	import HeaderCtaButtons from '@/components/ui/custom-components/header/header-cta-buttons.svelte';
	import { Spinner } from '@/components/ui/spinner/index.js';

	// useSession() returns a nanostores atom — read it reactively with `$`.
	const session = authClient.useSession();
	const user = $derived($session.data?.user);
</script>

<div class="flex items-center gap-2">
	{#if $session.isPending}
		<Spinner />
	{:else if user}
		<HeaderMobile />
	{:else}
		<HeaderCtaButtons />
	{/if}
</div>
