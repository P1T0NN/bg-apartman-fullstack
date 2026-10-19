<script lang="ts">
	// SVELTEKIT IMPORTS
	import { page } from '$app/state';

	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import HostSettingsHeader from '@/components/pages/(protected)/host/settings/host-settings-header.svelte';
	import HostSettingsTabPayouts from '@/components/pages/(protected)/host/settings/host-settings-tab-payouts.svelte';
	import GuestSettingsTabProfile from '@/components/pages/(protected)/guest/settings/guest-settings-tab-profile/guest-settings-tab-profile.svelte';
	import GuestSettingsTabSecurity from '@/components/pages/(protected)/guest/settings/guest-settings-tab-security/guest-settings-tab-security.svelte';
	import GuestSettingsTabDangerZone from '@/components/pages/(protected)/guest/settings/guest-settings-tab-danger-zone/guest-settings-tab-danger-zone.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
	import TabsUrl from '@/components/ui/custom-components/tabs-url/tabs-url.svelte';
	import * as Tabs from '@/components/ui/tabs/index.js';

	const user = $derived(page.data.currentUser);
</script>

<SvelteHead title={m['HostSettingsPage.pageTitle']()} noindex />

<div class="mx-auto flex w-full max-w-3xl flex-col gap-6">
	{#if user}
		<HostSettingsHeader {user} />
		<TabsUrl param="tab" defaultValue="profile" class="gap-6">
			{#snippet children(active)}
				<div class="overflow-x-auto border-b">
					<Tabs.List
						variant="line"
						class="h-10 w-max justify-start gap-3 sm:gap-8"
						aria-label={m['HostSettingsPage.HostSettingsTabs.label']()}
					>
						<Tabs.Trigger value="profile">
							{m['HostSettingsPage.HostSettingsTabs.profile']()}
						</Tabs.Trigger>
						<Tabs.Trigger value="security">
							{m['HostSettingsPage.HostSettingsTabs.security']()}
						</Tabs.Trigger>
						<Tabs.Trigger value="payouts">
							{m['HostSettingsPage.HostSettingsTabs.payouts']()}
						</Tabs.Trigger>
						<Tabs.Trigger value="danger">
							{m['HostSettingsPage.HostSettingsTabs.dangerZone']()}
						</Tabs.Trigger>
					</Tabs.List>
				</div>
				<Tabs.Content value="profile">
					<GuestSettingsTabProfile {user} />
				</Tabs.Content>
				<Tabs.Content value="security">
					{#if active === 'security'}
						<GuestSettingsTabSecurity />
					{/if}
				</Tabs.Content>
				<Tabs.Content value="payouts">
					<HostSettingsTabPayouts />
				</Tabs.Content>
				<Tabs.Content value="danger">
					<GuestSettingsTabDangerZone {user} />
				</Tabs.Content>
			{/snippet}
		</TabsUrl>
	{/if}
</div>
