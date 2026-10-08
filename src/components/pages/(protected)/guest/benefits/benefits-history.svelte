<script lang="ts">
	// LIBRARIES
	import { api } from '@convex/_generated/api';
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import DataList from '@/components/ui/custom-components/data-list/data-list.svelte';
	import EmptyData from '@/components/ui/custom-components/empty-data/empty-data.svelte';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';
	import BenefitsStayItem from './benefits-stay-item.svelte';
	import BenefitsHistoryLoading from './loading/benefits-history-loading.svelte';

	// HOOKS
	import { useConvexPagination } from '@/features/pagination/hooks/useConvexPagination.svelte.js';

	const stays = useConvexPagination(
		api.tables.bookings.queries.fetchMyBookings.fetchMyBookings,
		() => ({ filters: { status: 'completed' } }),
		{ pageSize: 5 }
	);
</script>

<section aria-labelledby="loyalty-history-title" class="flex min-w-0 flex-col gap-4">
	<div class="flex flex-col gap-1.5">
		<h2 id="loyalty-history-title" class="text-xl font-semibold tracking-tight">
			{m['BenefitsPage.BenefitsHistory.title']()}
		</h2>
		<p class="text-sm leading-6 text-muted-foreground">
			{m['BenefitsPage.BenefitsHistory.description']()}
		</p>
	</div>
	<div aria-busy={stays.loading}>
		<DataList pagination={stays} key={(stay) => stay._id} class="divide-y border-y">
			{#snippet children(stay)}
				<BenefitsStayItem {stay} />
			{/snippet}
			{#snippet loadingSnippet()}
				<div aria-label={m['BenefitsPage.loading']()}>
					<BenefitsHistoryLoading />
				</div>
			{/snippet}
			{#snippet errorSnippet()}
				<ErrorComponent message={m['ErrorMessages.loadFailed']()} />
			{/snippet}
			{#snippet empty()}
				<EmptyData
					title={m['BenefitsPage.BenefitsHistory.emptyTitle']()}
					description={m['BenefitsPage.BenefitsHistory.emptyDescription']()}
				>
					{#snippet icon()}
						<span class="icon-[lucide--luggage] size-5" aria-hidden="true"></span>
					{/snippet}
				</EmptyData>
			{/snippet}
		</DataList>
	</div>
</section>
