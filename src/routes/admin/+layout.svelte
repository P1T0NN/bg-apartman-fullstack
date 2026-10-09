<script lang="ts">
	// LIBRARIES
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import UsersIcon from '@lucide/svelte/icons/users';
	import ScrollTextIcon from '@lucide/svelte/icons/scroll-text';
	import MailIcon from '@lucide/svelte/icons/mail';
	import InboxIcon from '@lucide/svelte/icons/inbox';
	import StarIcon from '@lucide/svelte/icons/star';
	import HousesIcon from '@lucide/svelte/icons/houses';
	import CompassIcon from '@lucide/svelte/icons/compass';
	import { m } from '@/lib/paraglide/messages';
	import { page } from '$app/state';
	import { useCachedConvexQuery } from '@/hooks/useCachedConvexQuery.svelte.js';

	// CONVEX
	import { api } from '@convex/_generated/api';

	// CONFIG
	import {
		ADMIN_PAGE_ENDPOINTS,
		UNPROTECTED_PAGE_ENDPOINTS
	} from '@/shared/constants/pageEndpoints.js';

	// COMPONENTS
	import Logo from '@/components/ui/custom-components/logo/logo.svelte';
	import NativeSidebar from '@/components/ui/native-components/native-sidebar/native-sidebar.svelte';
	import NativeSidebarContent from '@/components/ui/native-components/native-sidebar/native-sidebar-content.svelte';
	import NativeSidebarLink from '@/components/ui/native-components/native-sidebar/native-sidebar-link.svelte';
	import NativeSidebarPageHeader from '@/components/ui/native-components/native-sidebar/native-sidebar-page-header.svelte';
	import NativeSidebarSection from '@/components/ui/native-components/native-sidebar/native-sidebar-section.svelte';
	import NativeSidebarUser from '@/components/ui/native-components/native-sidebar/native-sidebar-user.svelte';

	let { children } = $props();
	let mobileSidebarOpen = $state(false);

	const breadcrumbUserId = $derived(
		page.route.id === '/admin/users/[id]' ? page.params.id : undefined
	);
	const breadcrumbUser = useCachedConvexQuery(
		api.betterAuth.tables.users.queries.fetchUserBreadcrumbAdmin.fetchUserBreadcrumbAdmin,
		() => (breadcrumbUserId ? { id: breadcrumbUserId } : 'skip')
	);
</script>

<svelte:head>
	<title>Admin</title>
</svelte:head>

<div class="flex min-h-screen w-full bg-sidebar">
	<NativeSidebar label="Admin navigation" bind:openMobile={mobileSidebarOpen}>
		{#snippet sidebarHeader()}
			<Logo showImage={false} class="text-sm font-semibold" />
		{/snippet}

		{#snippet sidebarFooter()}
			<NativeSidebarUser />
		{/snippet}

		<div class="flex min-h-full flex-col gap-4 p-3">
			<nav aria-label="Admin" class="flex flex-col gap-1">
				<NativeSidebarSection title="General">
					<NativeSidebarLink href={ADMIN_PAGE_ENDPOINTS.DASHBOARD}>
						<LayoutDashboardIcon aria-hidden="true" />
						<span>Dashboard</span>
					</NativeSidebarLink>
					<NativeSidebarLink href={ADMIN_PAGE_ENDPOINTS.USERS}>
						<UsersIcon aria-hidden="true" />
						<span>Users</span>
					</NativeSidebarLink>
					<NativeSidebarLink href={ADMIN_PAGE_ENDPOINTS.LOGS}>
						<ScrollTextIcon aria-hidden="true" />
						<span>Logs</span>
					</NativeSidebarLink>
				</NativeSidebarSection>
				<NativeSidebarSection title="Accommodations">
					<NativeSidebarLink href={ADMIN_PAGE_ENDPOINTS.ACCOMMODATIONS}>
						<HousesIcon aria-hidden="true" />
						<span>Accommodations</span>
					</NativeSidebarLink>
				</NativeSidebarSection>
				<NativeSidebarSection title="Marketing">
					<NativeSidebarLink href={ADMIN_PAGE_ENDPOINTS.NEWSLETTERS}>
						<MailIcon aria-hidden="true" />
						<span>Newsletters</span>
					</NativeSidebarLink>
				</NativeSidebarSection>
				<NativeSidebarSection title="Support">
					<NativeSidebarLink href={ADMIN_PAGE_ENDPOINTS.REVIEWS}>
						<StarIcon aria-hidden="true" />
						<span>{m['AdminReviewsPage.pageTitle']()}</span>
					</NativeSidebarLink>
					<NativeSidebarLink href={ADMIN_PAGE_ENDPOINTS.FEEDBACK}>
						<InboxIcon aria-hidden="true" />
						<span>Feedback</span>
					</NativeSidebarLink>
				</NativeSidebarSection>
			</nav>
			<div class="mt-auto">
				<NativeSidebarLink href={UNPROTECTED_PAGE_ENDPOINTS.ROOT}>
					<CompassIcon aria-hidden="true" />
					<span>Back to Home Page</span>
				</NativeSidebarLink>
			</div>
		</div>
	</NativeSidebar>

	<main class="flex min-w-0 flex-1 flex-col bg-background md:overflow-hidden md:rounded-s-2xl">
		<NativeSidebarPageHeader
			title="Admin"
			rootHref={ADMIN_PAGE_ENDPOINTS.DASHBOARD}
			pageName={breadcrumbUser.data?.name}
			sidebarLabel="Open admin navigation"
			onOpenSidebar={() => (mobileSidebarOpen = true)}
		/>

		<NativeSidebarContent>
			{@render children()}
		</NativeSidebarContent>
	</main>
</div>
