<script lang="ts">
	// SVELTEKIT IMPORTS
	import { page } from '$app/state';

	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import GuestSettingsHeader from '@/components/pages/(protected)/guest/settings/guest-settings-header.svelte';
	import GuestSettingsTabDangerZone from '@/components/pages/(protected)/guest/settings/guest-settings-tab-danger-zone/guest-settings-tab-danger-zone.svelte';
	import GuestSettingsTabProfile from '@/components/pages/(protected)/guest/settings/guest-settings-tab-profile/guest-settings-tab-profile.svelte';
	import GuestSettingsTabSecurity from '@/components/pages/(protected)/guest/settings/guest-settings-tab-security/guest-settings-tab-security.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
	import TabsUrl from '@/components/ui/custom-components/tabs-url/tabs-url.svelte';
	import { TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

	const user = $derived(page.data.currentUser);
</script>

<SvelteHead title={m['GuestSettingsPage.pageTitle']()} noindex />

<div class="mx-auto flex w-full max-w-3xl flex-col gap-6">
	{#if user}
		<GuestSettingsHeader {user} />

		<TabsUrl param="tab" defaultValue="profile" class="gap-6">
			{#snippet children(active)}
				<div class="border-b">
					<TabsList
						variant="line"
						class="h-10 w-full justify-start gap-3 sm:w-fit sm:gap-8"
						aria-label={m['GuestSettingsPage.GuestSettingsTabs.label']()}
					>
						<TabsTrigger value="profile">
							{m['GuestSettingsPage.GuestSettingsTabs.profile']()}
						</TabsTrigger>

						<TabsTrigger value="security">
							{m['GuestSettingsPage.GuestSettingsTabs.security']()}
						</TabsTrigger>

						<TabsTrigger value="danger">
							{m['GuestSettingsPage.GuestSettingsTabs.dangerZone']()}
						</TabsTrigger>
					</TabsList>
				</div>

				<TabsContent value="profile">
					<GuestSettingsTabProfile {user} />
				</TabsContent>

				<TabsContent value="security">
					{#if active === 'security'}
						<GuestSettingsTabSecurity />
					{/if}
				</TabsContent>

				<TabsContent value="danger">
					<GuestSettingsTabDangerZone {user} />
				</TabsContent>
			{/snippet}
		</TabsUrl>
	{/if}
</div>
