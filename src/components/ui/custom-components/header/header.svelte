<script lang="ts">
	// LIBRARIES
	import { authClient } from '@/features/auth/lib/authClient';
	import { m } from '@/lib/paraglide/messages';

	// CONSTANTS
	import {
		PROTECTED_PAGE_ENDPOINTS,
		UNPROTECTED_PAGE_ENDPOINTS
	} from '@/shared/constants/pageEndpoints';

	// COMPONENTS
	import Logo from '@/components/ui/custom-components/logo/logo.svelte';
	import Link from '@/components/ui/custom-components/link/link.svelte';
	import HeaderItems from './header-items.svelte';
	import HeaderMobile from './header-mobile.svelte';
	import HeaderCtaButtons from './header-cta-buttons.svelte';
	import { Button } from '@/components/ui/button/index.js';
	import { Spinner } from '@/components/ui/spinner/index.js';

	// useSession() returns a nanostores atom — read it reactively with `$`.
	const session = authClient.useSession();
	const user = $derived($session.data?.user);
</script>

<header
	class="sticky top-0 z-40 border-b border-header-foreground/10 bg-header text-header-foreground"
>
	<div
		class="mx-auto grid h-16 w-full max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]"
	>
		<Link
			href={UNPROTECTED_PAGE_ENDPOINTS.ROOT}
			class="flex max-w-full min-w-0 items-center justify-self-start truncate text-lg font-semibold tracking-tight"
		>
			<Logo />
		</Link>

		<HeaderItems />

		<div class="flex min-w-0 items-center gap-2 justify-self-end">
			{#if $session.isPending}
				<Spinner />
			{:else if user}
				<Button href={PROTECTED_PAGE_ENDPOINTS.HOST_DASHBOARD} class="hidden lg:inline-flex">
					{m['Components.Header.switchToHosting']()}
				</Button>

				<HeaderMobile />
			{:else}
				<HeaderCtaButtons />
			{/if}
		</div>
	</div>
</header>
