<script lang="ts">
	// CONFIG
	import { COMPANY_DATA } from '@/shared/config';
	import {
		PROTECTED_PAGE_ENDPOINTS,
		UNPROTECTED_PAGE_ENDPOINTS
	} from '@/shared/constants/pageEndpoints.js';

	// COMPONENTS
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
		label={m['Components.GuestSidebar.navigationLabel']()}
		bind:openMobile={mobileSidebarOpen}
	>
		{#snippet sidebarHeader()}
			<span class="truncate text-sm font-semibold">{COMPANY_DATA.NAME}</span>
		{/snippet}

		{#snippet sidebarFooter()}
			<div class="flex flex-col gap-2">
				<NativeSidebarCta
					href={PROTECTED_PAGE_ENDPOINTS.HOST_DASHBOARD}
					icon="icon-[lucide--house]"
					label={m['Components.GuestSidebar.switchToHosting']()}
				/>
				<NativeSidebarUser />
			</div>
		{/snippet}

		<div class="flex min-h-full flex-col gap-4 p-3">
			<nav aria-label={m['Components.GuestSidebar.travelling']()} class="flex flex-col gap-1">
				<NativeSidebarSection title={m['Components.GuestSidebar.bookings']()}>
					<NativeSidebarLink href={PROTECTED_PAGE_ENDPOINTS.MY_BOOKINGS}>
						<span class="icon-[lucide--briefcase]" aria-hidden="true"></span>
						<span>{m['Components.GuestSidebar.trips']()}</span>
					</NativeSidebarLink>
					<NativeSidebarLink href={PROTECTED_PAGE_ENDPOINTS.CLAIM_BOOKING}>
						<span class="icon-[lucide--ticket]" aria-hidden="true"></span>
						<span>{m['Components.GuestSidebar.claimBooking']()}</span>
					</NativeSidebarLink>
				</NativeSidebarSection>
				<NativeSidebarSection title={m['Components.GuestSidebar.accommodations']()}>
					<NativeSidebarLink href={PROTECTED_PAGE_ENDPOINTS.FAVORITES}>
						<span class="icon-[lucide--heart]" aria-hidden="true"></span>
						<span>{m['Components.GuestSidebar.saved']()}</span>
					</NativeSidebarLink>
				</NativeSidebarSection>
				<NativeSidebarSection title={m['Components.GuestSidebar.account']()}>
					<NativeSidebarLink href={PROTECTED_PAGE_ENDPOINTS.GUEST_SETTINGS}>
						<span class="icon-[lucide--settings]" aria-hidden="true"></span>
						<span>{m['Components.GuestSidebar.settings']()}</span>
					</NativeSidebarLink>
				</NativeSidebarSection>
			</nav>
			<div class="mt-auto">
				<NativeSidebarLink href={UNPROTECTED_PAGE_ENDPOINTS.ROOT}>
					<span class="icon-[lucide--compass]" aria-hidden="true"></span>
					<span>{m['Components.GuestSidebar.backToExploring']()}</span>
				</NativeSidebarLink>
			</div>
		</div>
	</NativeSidebar>

	<main class="flex min-w-0 flex-1 flex-col bg-background md:overflow-hidden md:rounded-s-2xl">
		<NativeSidebarPageHeader
			title={m['Components.GuestSidebar.travelling']()}
			rootHref={PROTECTED_PAGE_ENDPOINTS.MY_BOOKINGS}
			sidebarLabel={m['Components.GuestSidebar.openNavigation']()}
			onOpenSidebar={() => (mobileSidebarOpen = true)}
		/>
		<NativeSidebarContent>
			{@render children()}
		</NativeSidebarContent>
	</main>
</div>
