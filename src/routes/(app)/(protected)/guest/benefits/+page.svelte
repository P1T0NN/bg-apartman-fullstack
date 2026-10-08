<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	import { useQuery } from 'convex-svelte';
	import { api } from '@convex/_generated/api';

	// COMPONENTS
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
	import BenefitsHeader from '@/components/pages/(protected)/guest/benefits/benefits-header.svelte';
	import BenefitsSummary from '@/components/pages/(protected)/guest/benefits/benefits-summary.svelte';
	import BenefitsLevels from '@/components/pages/(protected)/guest/benefits/benefits-levels.svelte';
	import BenefitsHistory from '@/components/pages/(protected)/guest/benefits/benefits-history.svelte';
	import BenefitsGuide from '@/components/pages/(protected)/guest/benefits/benefits-guide.svelte';
	import BenefitsSummaryLoading from '@/components/pages/(protected)/guest/benefits/loading/benefits-summary-loading.svelte';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';

	const result = useQuery(
		api.tables.loyaltyMemberships.queries.fetchMyBenefits.fetchMyBenefits,
		() => ({})
	);
</script>

<SvelteHead title={m['BenefitsPage.pageTitle']()} noindex />

<div class="flex w-full flex-col gap-8 pb-8 sm:gap-10">
	<BenefitsHeader />
	{#if result.error}
		<ErrorComponent message={m['ErrorMessages.loadFailed']()} />
	{:else if result.isLoading}
		<div aria-busy="true" aria-label={m['BenefitsPage.loading']()}>
			<BenefitsSummaryLoading />
		</div>
	{:else if result.data}
		<BenefitsSummary benefits={result.data} />
	{/if}
	<BenefitsLevels currentLevel={result.data?.level ?? 0} />

	<div class="grid gap-10 xl:grid-cols-2 xl:gap-12">
		<BenefitsHistory />
		<BenefitsGuide />
	</div>
</div>
