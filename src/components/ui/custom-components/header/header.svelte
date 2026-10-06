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
	import Link from '@/components/ui/custom-components/link/link.svelte';
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

{#snippet mobileMenuTrigger()}
	<span class="icon-[lucide--menu] size-5" aria-hidden="true"></span>
{/snippet}

{#snippet menuLink(href: string, icon: string, label: string)}
	<!-- eslint-disable svelte/no-navigation-without-resolve -->
	<a
		{href}
		class={menuItemClass}
		onclick={(event) => event.currentTarget.closest<HTMLElement>('[popover]')?.hidePopover()}
	>
		<span class={icon} aria-hidden="true"></span>
		<span>{label}</span>
	</a>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
{/snippet}

<header class="sticky top-0 z-40 border-b bg-background">
	<div
		class="mx-auto grid h-16 w-full max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]"
	>
		<Link
			href={UNPROTECTED_PAGE_ENDPOINTS.ROOT}
			class="max-w-full min-w-0 justify-self-start truncate text-lg font-semibold tracking-tight"
		>
			{COMPANY_DATA.NAME}
		</Link>

		<nav
			aria-label={m['Components.Header.navigation']()}
			class="hidden items-center justify-center gap-1 lg:flex"
		>
			<Button variant="ghost" href={UNPROTECTED_PAGE_ENDPOINTS.CONTACT}>
				{m['Components.Header.contact']()}
			</Button>
			<Button variant="ghost" href={UNPROTECTED_PAGE_ENDPOINTS.FEEDBACK}>
				{m['Components.Header.feedback']()}
			</Button>
		</nav>

		<div class="flex min-w-0 items-center gap-2 justify-self-end">
			{#if $session.isPending}
				<Spinner />
			{:else if user}
				<Button href={PROTECTED_PAGE_ENDPOINTS.HOST_DASHBOARD} class="hidden lg:inline-flex">
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
					class="hidden lg:inline-flex"
					onclick={(event) => {
						event.preventDefault();
						authDialog.open('sign-up');
					}}
				>
					{m['Components.Header.listYourProperty']()}
				</Button>
			{/if}
			<NativePopover
				id="header-mobile-menu"
				trigger={mobileMenuTrigger}
				triggerLabel={m['Components.Header.navigation']()}
				triggerClass="size-10 justify-center lg:hidden"
				class="w-56 max-w-[calc(100vw-2rem)] lg:hidden"
			>
				<nav aria-label={m['Components.Header.navigation']()}>
					{@render menuLink(
						UNPROTECTED_PAGE_ENDPOINTS.CONTACT,
						'icon-[lucide--mail] size-4',
						m['Components.Header.contact']()
					)}
					{@render menuLink(
						UNPROTECTED_PAGE_ENDPOINTS.FEEDBACK,
						'icon-[lucide--message-square] size-4',
						m['Components.Header.feedback']()
					)}
					<Separator class="my-1" />
					{#if user}
						{@render menuLink(
							PROTECTED_PAGE_ENDPOINTS.HOST_DASHBOARD,
							'icon-[lucide--house] size-4',
							m['Components.Header.switchToHosting']()
						)}
					{:else}
						<Button
							variant="ghost"
							class={menuItemClass}
							href={UNPROTECTED_PAGE_ENDPOINTS.SIGN_UP}
							onclick={(event) => {
								event.preventDefault();
								document.getElementById('header-mobile-menu')?.hidePopover();
								authDialog.open('sign-up');
							}}
						>
							<span class="icon-[lucide--house-plus] size-4" aria-hidden="true"></span>
							{m['Components.Header.listYourProperty']()}
						</Button>
					{/if}
				</nav>
			</NativePopover>
		</div>
	</div>
</header>

<AuthDialog bind:this={authDialog} />
