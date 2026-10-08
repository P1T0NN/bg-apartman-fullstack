<script lang="ts">
	// SVELTEKIT IMPORTS
	import { page } from '$app/state';

	// SVELTE IMPORTS
	import { onMount } from 'svelte';

	// LIBRARIES
	import { useAction } from 'convex-svelte';
	import { m } from '@/lib/paraglide/messages.js';

	// CONVEX
	import { api } from '@convex/_generated/api.js';

	// COMPONENTS
	import DataList from '@/components/ui/custom-components/data-list/data-list.svelte';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';
	import AccommodationFeePaymentItem from './accommodation-fee-payment-item.svelte';
	import AccommodationFeePaymentHistoryLoading from './loading/accommodation-fee-payment-history-loading.svelte';

	// HOOKS
	import { useConvexPagination } from '@/features/pagination/hooks/useConvexPagination.svelte.js';

	// UTILS
	import { toastMessage } from '@/utils/toastMessage.js';

	// TYPES
	import type { Id } from '@convex/_generated/dataModel.js';

	let { accommodationId }: { accommodationId: Id<'accommodations'> } = $props();
	const titleId = $props.id();
	const isCheckoutCancelled = $derived(page.url.searchParams.get('fee_checkout') === 'cancelled');
	const payments = useConvexPagination(
		api.tables.accommodationFeePayments.queries.fetchFeePayments.fetchFeePayments,
		() => ({ accommodationId }),
		{ pageSize: 5 }
	);
	const refresh = useAction(
		api.tables.accommodationFeePayments.actions.refreshFeePayment.refreshFeePayment
	);
	onMount(() => {
		const paymentId = page.url.searchParams.get('fee_payment');
		if (paymentId) {
			// SAFETY: the action validates the ID and derives access from the authenticated identity.
			void refresh({ paymentId: paymentId as Id<'accommodationFeePayments'> }).catch((error) => {
				toastMessage({ type: 'error', error, message: m['ErrorMessages.unexpected']() });
			});
		}
	});
</script>

<section class="flex min-w-0 flex-col gap-3" aria-labelledby={titleId}>
	<h3 id={titleId} class="font-semibold">
		{m['PaymentsFeature.FeePayments.title']()}
	</h3>
	<p class="text-sm text-muted-foreground">
		{m['PaymentsFeature.FeePayments.manualRenewal']()}
	</p>
	{#if isCheckoutCancelled}
		<p role="status" class="text-sm">
			{m['PaymentsFeature.FeePayments.checkoutCancelled']()}
		</p>
	{/if}
	<DataList pagination={payments} key={(payment) => payment._id} class="divide-y border-y">
		{#snippet children(payment)}
			<AccommodationFeePaymentItem {payment} />
		{/snippet}
		{#snippet loadingSnippet()}
			<AccommodationFeePaymentHistoryLoading />
		{/snippet}
		{#snippet errorSnippet()}
			<ErrorComponent message={m['ErrorMessages.loadFailed']()} />
		{/snippet}
		{#snippet empty()}
			<p class="py-3 text-sm text-muted-foreground">
				{m['PaymentsFeature.FeePayments.empty']()}
			</p>
		{/snippet}
	</DataList>
</section>
