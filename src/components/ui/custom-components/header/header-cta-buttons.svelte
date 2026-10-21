<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// CONSTANTS
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints';

	// COMPONENTS
	import AuthDialog from '@/features/auth/components/auth-dialog/auth-dialog.svelte';
	import HeaderMenu from './header-menu.svelte';
	import { Button } from '@/components/ui/button/index.js';
	import { Separator } from '@/components/ui/separator/index.js';

	const uid = $props.id();
	let authDialog: AuthDialog;

	const menuItemClass =
		'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none';
</script>

{#snippet mobileMenuTrigger()}
	<span class="icon-[lucide--menu] size-5" aria-hidden="true"></span>
{/snippet}

{#snippet menuLink(href: string, icon: string, label: string, close: () => void)}
	<!-- eslint-disable svelte/no-navigation-without-resolve -->
	<a {href} class={menuItemClass} onclick={close}>
		<span class={icon} aria-hidden="true"></span>
		<span>{label}</span>
	</a>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
{/snippet}

<Button
	variant="outline"
	href={UNPROTECTED_PAGE_ENDPOINTS.SIGN_IN}
	class="border-header-foreground/25 bg-transparent text-header-foreground hover:bg-header-foreground/10 hover:text-header-foreground"
	onclick={(event) => {
		event.preventDefault();
		authDialog.open('sign-in');
	}}
>
	{m['Components.Header.signIn']()}
</Button>
<Button
	href={UNPROTECTED_PAGE_ENDPOINTS.SIGN_UP}
	class="hidden lg:inline-flex"
	onclick={(event) => {
		event.preventDefault();
		authDialog.open('sign-up');
	}}
>
	{m['Components.Header.listYourProperty']()}
</Button>

<HeaderMenu
	id={`${uid}-guest-menu`}
	trigger={mobileMenuTrigger}
	triggerLabel={m['Components.Header.navigation']()}
	triggerClass="size-10 justify-center lg:hidden"
>
	{#snippet children(close)}
		<nav aria-label={m['Components.Header.navigation']()}>
			{@render menuLink(
				UNPROTECTED_PAGE_ENDPOINTS.CONTACT,
				'icon-[lucide--mail] size-4',
				m['Components.Header.contact'](),
				close
			)}
			{@render menuLink(
				UNPROTECTED_PAGE_ENDPOINTS.FEEDBACK,
				'icon-[lucide--message-square] size-4',
				m['Components.Header.feedback'](),
				close
			)}
			<Separator class="my-1" />
			<Button
				variant="ghost"
				class={menuItemClass}
				href={UNPROTECTED_PAGE_ENDPOINTS.SIGN_UP}
				onclick={(event) => {
					event.preventDefault();
					close();
					authDialog.open('sign-up');
				}}
			>
				<span class="icon-[lucide--house-plus] size-4" aria-hidden="true"></span>
				{m['Components.Header.listYourProperty']()}
			</Button>
		</nav>
	{/snippet}
</HeaderMenu>

<AuthDialog bind:this={authDialog} />
