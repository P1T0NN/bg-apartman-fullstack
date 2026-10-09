<script lang="ts">
	// LIBRARIES
	import { useQuery } from 'convex-svelte';
	import { getLocale } from '@/lib/paraglide/runtime.js';
	import { m } from '@/lib/paraglide/messages.js';

	// CONVEX
	import { api } from '@convex/_generated/api.js';

	// COMPONENTS
	import NativeDialog from '@/components/ui/native-components/native-dialog/native-dialog.svelte';
	import RefundFeeButton from './refund-fee-button.svelte';

	// TYPES
	import type { FunctionReturnType } from 'convex/server';
	import type { Id } from '@convex/_generated/dataModel.js';
	import type { Snippet } from 'svelte';

	type Accommodation = FunctionReturnType<
		typeof api.tables.accommodations.queries.fetchAccommodationsAdmin.fetchAccommodationsAdmin
	>['items'][number];

	let {
		accommodation,
		trigger: refundTrigger
	}: {
		accommodation: Accommodation;
		trigger: Snippet<[{ id: string; eligible: boolean }]>;
	} = $props();
	const titleId = $props.id();
	let reviewedPaymentId = $state<Id<'accommodationFeePayments'> | null>(null);
	let reviewedAmount = $state(0);
	const payments = useQuery(
		api.tables.accommodationFeePayments.queries.fetchFeePayments.fetchFeePayments,
		() => ({ accommodationId: accommodation._id, paginationOpts: { numItems: 1, cursor: null } })
	);
	const payment = $derived(payments.data?.items[0]);
	const remaining = $derived(payment ? payment.terms.amountMinor - payment.refundedAmountMinor : 0);
	const eligible = $derived(
		Boolean(
			payment?.paidAt &&
			remaining > 0 &&
			(payment.status === 'paid' || payment.status === 'refund_pending')
		)
	);
	const isReviewedPaymentCurrent = $derived(
		eligible && payment?._id === reviewedPaymentId && remaining === reviewedAmount
	);
</script>

<NativeDialog
	aria-labelledby={titleId}
	onbeforetoggle={(event) => {
		if (event.newState === 'open') {
			reviewedPaymentId = payment?._id ?? null;
			reviewedAmount = remaining;
		}
	}}
>
	{#snippet trigger({ id })}
		{@render refundTrigger({ id, eligible })}
	{/snippet}
	{#snippet children({ id, close })}
		<div class="flex flex-col gap-5 p-6">
			<h2 id={titleId} class="text-lg font-semibold">
				{m['AdminAccommodationsPage.AdminAccommodationsRefundFeeDialog.title']({
					name: accommodation.name
				})}
			</h2>
			<p class="text-sm text-muted-foreground">
				{m['AdminAccommodationsPage.AdminAccommodationsRefundFeeDialog.hint']()}
			</p>
			{#if payment}
				<p class="font-medium">
					{new Intl.NumberFormat(getLocale(), {
						style: 'currency',
						currency: payment.terms.currency
					}).format(reviewedAmount / 100)}
				</p>
			{/if}
			{#if reviewedPaymentId}
				<RefundFeeButton
					paymentId={reviewedPaymentId}
					expectedAmountMinor={reviewedAmount}
					canRefund={isReviewedPaymentCurrent}
					dialogId={id}
					{close}
				/>
			{/if}
		</div>
	{/snippet}
</NativeDialog>
