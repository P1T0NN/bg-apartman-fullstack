<script lang="ts">
	// SVELTEKIT IMPORTS
	import { page } from '$app/state';

	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import GuestSettingsDangerZone from '@/components/pages/(protected)/guest/settings/guest-settings-danger-zone.svelte';
	import GuestSettingsHeader from '@/components/pages/(protected)/guest/settings/guest-settings-header.svelte';
	import GuestSettingsProfileCard from '@/components/pages/(protected)/guest/settings/guest-settings-profile-card.svelte';
	import GuestSettingsSecurityCard from '@/components/pages/(protected)/guest/settings/guest-settings-security-card.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';

	const user = $derived(page.data.currentUser);
</script>

<SvelteHead title={m['GuestSettingsPage.pageTitle']()} noindex />

<div class="mx-auto flex w-full max-w-3xl flex-col gap-6">
	{#if user}
		<GuestSettingsHeader {user} />
		<GuestSettingsProfileCard {user} />
		<GuestSettingsSecurityCard />
		<GuestSettingsDangerZone {user} />
	{/if}
</div>
