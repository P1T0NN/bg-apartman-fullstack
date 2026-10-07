<script lang="ts">
	// SVELTEKIT IMPORTS
	import { page } from '$app/state';

	// LIBRARIES
	import { useQuery } from 'convex-svelte';
	import { api } from '@convex/_generated/api.js';

	// MESSAGES
	import { m } from '@/lib/paraglide/messages.js';

	// COMPONENTS
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';
	import MyAccommodationFeesLoading from '../loading/my-accommodation-fees-loading.svelte';
	import MyAccommodationTabSettingsFees from './my-accommodation-tab-settings-fees/my-accommodation-tab-settings-fees.svelte';
	import MyAccommodationTabSettingsDangerZone from './my-accommodation-tab-settings-danger-zone/my-accommodation-tab-settings-danger-zone.svelte';

	// TYPES
	import type { Id } from '@convex/_generated/dataModel.js';

	// SAFETY: Convex validates the untrusted route ID and checks ownership.
	const accommodationId = $derived(page.params.id as Id<'accommodations'>);

	const settings = useQuery(
		api.tables.accommodations.queries.fetchMyAccommodationSettings.fetchMyAccommodationSettings,
		() => ({ id: accommodationId })
	);

	const hasSettingsError = $derived(
		Boolean(settings.error) || (!settings.isLoading && !settings.data)
	);
</script>

<div class="flex flex-col gap-8">
	{#if hasSettingsError}
		<ErrorComponent message={m['MyAccommodationPage.MyAccommodationTabSettings.loadError']()} />
	{:else if settings.isLoading}
		<div role="status" aria-label={m['MyAccommodationPage.MyAccommodationTabSettings.loading']()}>
			<MyAccommodationFeesLoading />
		</div>
	{:else if settings.data}
		<MyAccommodationTabSettingsFees data={settings.data.billing} />
		<MyAccommodationTabSettingsDangerZone />
	{/if}
</div>
