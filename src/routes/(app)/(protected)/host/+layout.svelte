<script lang="ts">
	// CONFIG
	import {
		PROTECTED_PAGE_ENDPOINTS,
		UNPROTECTED_PAGE_ENDPOINTS
	} from '@/shared/constants/pageEndpoints.js';

	// COMPONENTS
	import Logo from '@/components/ui/custom-components/logo/logo.svelte';
	import NativeSidebar from '@/components/ui/native-components/native-sidebar/native-sidebar.svelte';
	import NativeSidebarContent from '@/components/ui/native-components/native-sidebar/native-sidebar-content.svelte';
	import NativeSidebarCta from '@/components/ui/native-components/native-sidebar/native-sidebar-cta.svelte';
	import NativeSidebarLink from '@/components/ui/native-components/native-sidebar/native-sidebar-link.svelte';
	import NativeSidebarPageHeader from '@/components/ui/native-components/native-sidebar/native-sidebar-page-header.svelte';
	import NativeSidebarSection from '@/components/ui/native-components/native-sidebar/native-sidebar-section.svelte';
	import NativeSidebarUser from '@/components/ui/native-components/native-sidebar/native-sidebar-user.svelte';
	import { m } from '@/lib/paraglide/messages';

	let { children } = $props();
	let mobileSidebarOpen = $state(false);
</script>

<div class="flex min-h-screen w-full bg-sidebar">
	<NativeSidebar
		label={m['Components.HostSidebar.navigationLabel']()}
		bind:openMobile={mobileSidebarOpen}
	>
		{#snippet sidebarHeader()}
			<Logo showImage={false} class="text-sm font-semibold" />
		{/snippet}

		{#snippet sidebarFooter()}
			<div class="flex flex-col gap-2">
				<NativeSidebarCta
					href={PROTECTED_PAGE_ENDPOINTS.MY_BOOKINGS}
					icon="icon-[lucide--plane]"
					label={m['Components.HostSidebar.switchToTravelling']()}
				/>
				<NativeSidebarUser />
			</div>
		{/snippet}

		<div class="flex min-h-full flex-col gap-4 p-3">
			<nav aria-label={m['Components.HostSidebar.hosting']()} class="flex flex-col gap-1">
				<NativeSidebarSection title={m['Components.HostSidebar.general']()}>
					<NativeSidebarLink href={PROTECTED_PAGE_ENDPOINTS.HOST_DASHBOARD}>
						<span class="icon-[lucide--layout-dashboard]" aria-hidden="true"></span>
						<span>{m['Components.HostSidebar.dashboard']()}</span>
					</NativeSidebarLink>
				</NativeSidebarSection>
				<NativeSidebarSection title={m['Components.HostSidebar.accommodations']()}>
					<NativeSidebarLink href={PROTECTED_PAGE_ENDPOINTS.ADD_ACCOMMODATION}>
						<span class="icon-[lucide--circle-plus]" aria-hidden="true"></span>
						<span>{m['Components.HostSidebar.addAccommodation']()}</span>
					</NativeSidebarLink>
					<NativeSidebarLink href={PROTECTED_PAGE_ENDPOINTS.MY_ACCOMMODATIONS}>
						<span class="icon-[lucide--house]" aria-hidden="true"></span>
						<span>{m['Components.HostSidebar.myAccommodations']()}</span>
					</NativeSidebarLink>
				</NativeSidebarSection>
				<NativeSidebarSection title={m['Components.HostSidebar.bookings']()}>
					<NativeSidebarLink href={PROTECTED_PAGE_ENDPOINTS.HOST_BOOKINGS}>
						<span class="icon-[lucide--calendar-check]" aria-hidden="true"></span>
						<span>{m['Components.HostSidebar.bookings']()}</span>
					</NativeSidebarLink>
				</NativeSidebarSection>
			</nav>
			<div class="mt-auto">
				<NativeSidebarLink href={UNPROTECTED_PAGE_ENDPOINTS.ROOT}>
					<span class="icon-[lucide--compass]" aria-hidden="true"></span>
					<span>{m['Components.HostSidebar.backToHome']()}</span>
				</NativeSidebarLink>
			</div>
		</div>
	</NativeSidebar>

	<main class="flex min-w-0 flex-1 flex-col bg-background md:overflow-hidden md:rounded-s-2xl">
		<NativeSidebarPageHeader
			title={m['Components.HostSidebar.hosting']()}
			rootHref={PROTECTED_PAGE_ENDPOINTS.HOST_DASHBOARD}
			sidebarLabel={m['Components.HostSidebar.openNavigation']()}
			onOpenSidebar={() => (mobileSidebarOpen = true)}
		/>
		<NativeSidebarContent>
			{@render children()}
		</NativeSidebarContent>
	</main>
</div>
