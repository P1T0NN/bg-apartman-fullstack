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
	import * as Card from '@/components/ui/card/index.js';
	import MyAccommodationFeesLoading from '../loading/my-accommodation-fees-loading.svelte';
	import MyAccommodationTabBillingHeader from './my-accommodation-tab-billing-header.svelte';
	import MyAccommodationTabBillingSummary from './my-accommodation-tab-billing-summary.svelte';
	import AccommodationFeePaymentHistory from '@/features/payments/components/accommodation-fee-payment-history/accommodation-fee-payment-history.svelte';

	// TYPES
	import type { Id } from '@convex/_generated/dataModel.js';

	// SAFETY: Convex validates the route ID and checks accommodation ownership.
	const accommodationId = $derived(page.params.id as Id<'accommodations'>);
	const titleId = $props.id();

	const settings = useQuery(
		api.tables.accommodations.queries.fetchMyAccommodationSettings.fetchMyAccommodationSettings,
		() => ({ id: accommodationId })
	);
	const hasBillingError = $derived(
		Boolean(settings.error) || (!settings.isLoading && !settings.data)
	);
</script>

<section aria-labelledby={titleId} class="flex flex-col gap-8">
	<MyAccommodationTabBillingHeader id={titleId} {accommodationId} />

	{#if hasBillingError}
		<ErrorComponent message={m['MyAccommodationPage.MyAccommodationTabBilling.loadError']()} />
	{:else if settings.isLoading}
		<div role="status" aria-label={m['MyAccommodationPage.MyAccommodationTabBilling.loading']()}>
			<MyAccommodationFeesLoading />
		</div>
	{:else if settings.data}
		<MyAccommodationTabBillingSummary data={settings.data.billing} />
		<Card.Root class="text-base">
			<Card.Content>
				<AccommodationFeePaymentHistory {accommodationId} />
			</Card.Content>
		</Card.Root>
	{/if}
</section>
