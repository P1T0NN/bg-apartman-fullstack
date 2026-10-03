<script lang="ts">
	// LIBRARIES
	import { authClient } from '@/features/auth/lib/authClient';

	// CONSTANTS
	import {
		ADMIN_PAGE_ENDPOINTS,
		PROTECTED_PAGE_ENDPOINTS,
		UNPROTECTED_PAGE_ENDPOINTS
	} from '@/shared/constants/pageEndpoints';
	import { COMPANY_DATA } from '@/shared/config';

	// COMPONENTS
	import AuthDialog from '@/features/auth/components/auth-dialog/auth-dialog.svelte';
	import LogoutButton from '@/features/auth/components/logout-button/logout-button.svelte';
	import NativeAvatar from '@/components/ui/native-components/native-avatar/native-avatar.svelte';
	import NativePopover from '@/components/ui/native-components/native-popover/native-popover.svelte';
	import { Button } from '@/components/ui/button/index.js';
	import { Separator } from '@/components/ui/separator/index.js';
	import Spinner from '@/components/ui/spinner/spinner.svelte';
	import { m } from '@/lib/paraglide/messages';

	// useSession() returns a nanostores atom — read it reactively with `$`.
	const session = authClient.useSession();
	const user = $derived($session.data?.user);
	const isAdmin = $derived(user?.role === 'admin');

	let authDialog: AuthDialog;

	const menuItemClass =
		'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none';
</script>

{#snippet avatar()}
	<NativeAvatar name={user?.name ?? ''} image={user?.image} />
{/snippet}

{#snippet menuLink(href: string, icon: string, label: string)}
	<!-- eslint-disable svelte/no-navigation-without-resolve -->
	<a {href} class={menuItemClass}>
		<span class={icon} aria-hidden="true"></span>
		<span>{label}</span>
	</a>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
{/snippet}

<header class="sticky top-0 z-40 border-b bg-background">
	<div
		class="mx-auto grid h-16 w-full max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 sm:px-6"
	>
		<a
			href={UNPROTECTED_PAGE_ENDPOINTS.ROOT}
			class="justify-self-start text-lg font-semibold tracking-tight"
		>
			{COMPANY_DATA.NAME}
		</a>

		<nav
			aria-label={m['Components.Header.navigation']()}
			class="flex items-center justify-center gap-1"
		>
			<Button variant="ghost" href={UNPROTECTED_PAGE_ENDPOINTS.CONTACT}>
				{m['Components.Header.contact']()}
			</Button>
			<Button variant="ghost" href={UNPROTECTED_PAGE_ENDPOINTS.FEEDBACK}>
				{m['Components.Header.feedback']()}
			</Button>
		</nav>

		<div class="flex items-center gap-2 justify-self-end">
			{#if $session.isPending}
				<Spinner />
			{:else if user}
				<Button href={PROTECTED_PAGE_ENDPOINTS.HOST_DASHBOARD}>
					{m['Components.Header.switchToHosting']()}
				</Button>

				<NativePopover id="user-menu" align="end" trigger={avatar} class="w-56">
					<div class="flex items-center gap-3 px-2 py-2">
						{@render avatar()}

						<div class="min-w-0">
							<p class="truncate text-sm font-medium text-foreground">{user.name}</p>
							<p class="truncate text-xs text-muted-foreground">{user.email}</p>
						</div>
					</div>

					<Separator class="my-1" />

					{@render menuLink(
						PROTECTED_PAGE_ENDPOINTS.MY_BOOKINGS,
						'icon-[lucide--briefcase] size-4',
						m['Components.Header.trips']()
					)}
					{@render menuLink(
						PROTECTED_PAGE_ENDPOINTS.FAVORITES,
						'icon-[lucide--heart] size-4',
						m['Components.Header.saved']()
					)}
					{@render menuLink(
						UNPROTECTED_PAGE_ENDPOINTS.FIND_BOOKING,
						'icon-[lucide--search] size-4',
						m['Components.Header.findBooking']()
					)}

					<Separator class="my-1" />

					{@render menuLink(
						PROTECTED_PAGE_ENDPOINTS.ADD_ACCOMMODATION,
						'icon-[lucide--house-plus] size-4',
						m['Components.Header.listYourProperty']()
					)}

					<Separator class="my-1" />

					{#if isAdmin}
						{@render menuLink(
							ADMIN_PAGE_ENDPOINTS.DASHBOARD,
							'icon-[lucide--shield] size-4',
							m['Components.Header.adminDashboard']()
						)}
					{/if}
					{@render menuLink(
						PROTECTED_PAGE_ENDPOINTS.GUEST_SETTINGS,
						'icon-[lucide--settings] size-4',
						m['Components.Header.accountSettings']()
					)}
					{@render menuLink(
						UNPROTECTED_PAGE_ENDPOINTS.HELP,
						'icon-[lucide--circle-help] size-4',
						m['Components.Header.help']()
					)}

					<LogoutButton class={menuItemClass}>
						<span class="icon-[lucide--log-out] size-4" aria-hidden="true"></span>
						{m['Components.Header.signOut']()}
					</LogoutButton>
				</NativePopover>
			{:else}
				<Button
					variant="outline"
					href={UNPROTECTED_PAGE_ENDPOINTS.SIGN_IN}
					onclick={(event) => {
						event.preventDefault();
						authDialog.open('sign-in');
					}}
				>
					{m['Components.Header.signIn']()}
				</Button>
				<Button
					href={UNPROTECTED_PAGE_ENDPOINTS.SIGN_UP}
					onclick={(event) => {
						event.preventDefault();
						authDialog.open('sign-up');
					}}
				>
					{m['Components.Header.listYourProperty']()}
				</Button>
			{/if}
		</div>
	</div>
</header>

<AuthDialog bind:this={authDialog} />
