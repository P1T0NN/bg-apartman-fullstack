<script lang="ts">
	// LIBRARIES
	import { authClient } from '@/features/auth/lib/authClient';
	import { m } from '@/lib/paraglide/messages';

	// CONSTANTS
	import {
		ADMIN_PAGE_ENDPOINTS,
		PROTECTED_PAGE_ENDPOINTS,
		UNPROTECTED_PAGE_ENDPOINTS
	} from '@/shared/constants/pageEndpoints';

	// COMPONENTS
	import HeaderMenu from './header-menu.svelte';
	import LogoutButton from '@/features/auth/components/logout-button/logout-button.svelte';
	import NativeAvatar from '@/components/ui/native-components/native-avatar/native-avatar.svelte';
	import { Separator } from '@/components/ui/separator/index.js';

	// HOOKS
	import { usePathname } from '@/hooks/usePathname.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';

	const session = authClient.useSession();
	const user = $derived($session.data?.user);
	const isAdmin = $derived(user?.role === 'admin');
	const pathname = usePathname();
	const uid = $props.id();

	const menuItemClass =
		'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none';

	const activeNavClass =
		'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground';
</script>

{#snippet avatar()}
	<NativeAvatar name={user?.name ?? ''} image={user?.image} />
{/snippet}

{#snippet menuLink(href: string, icon: string, label: string, close: () => void)}
	<!-- eslint-disable svelte/no-navigation-without-resolve -->
	<a
		{href}
		class={cn(menuItemClass, pathname.isActive(href) && activeNavClass)}
		aria-current={pathname.isActive(href) ? 'page' : undefined}
		onclick={close}
	>
		<span class={icon} aria-hidden="true"></span>
		<span>{label}</span>
	</a>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
{/snippet}

{#snippet userInfo()}
	<div class="flex min-w-0 items-center gap-3">
		{@render avatar()}

		<div class="min-w-0">
			<p class="truncate text-sm font-medium text-foreground">{user?.name}</p>
			<p class="truncate text-xs text-muted-foreground">{user?.email}</p>
		</div>
	</div>
{/snippet}

<HeaderMenu
	id={`${uid}-user-menu`}
	trigger={avatar}
	triggerLabel={m['Components.Header.navigation']()}
	header={userInfo}
>
	{#snippet children(close)}
		<div class="hidden px-2 py-2 lg:block">
			{@render userInfo()}
			<Separator class="my-1" />
		</div>

		{@render menuLink(
			PROTECTED_PAGE_ENDPOINTS.MY_BOOKINGS,
			'icon-[lucide--briefcase] size-4',
			m['Components.Header.trips'](),
			close
		)}
		{@render menuLink(
			PROTECTED_PAGE_ENDPOINTS.FAVORITES,
			'icon-[lucide--heart] size-4',
			m['Components.Header.saved'](),
			close
		)}
		{@render menuLink(
			UNPROTECTED_PAGE_ENDPOINTS.FIND_BOOKING,
			'icon-[lucide--search] size-4',
			m['Components.Header.findBooking'](),
			close
		)}

		<Separator class="my-1" />

		{@render menuLink(
			PROTECTED_PAGE_ENDPOINTS.ADD_ACCOMMODATION,
			'icon-[lucide--house-plus] size-4',
			m['Components.Header.listYourProperty'](),
			close
		)}

		<Separator class="my-1" />

		{#if isAdmin}
			{@render menuLink(
				ADMIN_PAGE_ENDPOINTS.DASHBOARD,
				'icon-[lucide--shield] size-4',
				m['Components.Header.adminDashboard'](),
				close
			)}
		{/if}
		{@render menuLink(
			PROTECTED_PAGE_ENDPOINTS.SETTINGS,
			'icon-[lucide--settings] size-4',
			m['Components.Header.accountSettings'](),
			close
		)}
		{@render menuLink(
			UNPROTECTED_PAGE_ENDPOINTS.HELP,
			'icon-[lucide--circle-help] size-4',
			m['Components.Header.help'](),
			close
		)}

		<div class="lg:hidden">
			<Separator class="my-1" />
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
			{@render menuLink(
				PROTECTED_PAGE_ENDPOINTS.HOST_DASHBOARD,
				'icon-[lucide--house] size-4',
				m['Components.Header.switchToHosting'](),
				close
			)}
			<Separator class="my-1" />
		</div>
		<LogoutButton class={menuItemClass}>
			<span class="icon-[lucide--log-out] size-4" aria-hidden="true"></span>
			{m['Components.Header.signOut']()}
		</LogoutButton>
	{/snippet}
</HeaderMenu>
