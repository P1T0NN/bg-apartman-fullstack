<script lang="ts">
	// LIBRARIES
	import { useAction, useQuery } from 'convex-svelte';
	import { getLocale } from '@/lib/paraglide/runtime.js';
	import { m } from '@/lib/paraglide/messages.js';

	// CONVEX
	import { api } from '@convex/_generated/api.js';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import NativeDialog from '@/components/ui/native-components/native-dialog/native-dialog.svelte';
	import ConfirmDialogActions from '@/components/ui/custom-components/confirm-dialog-actions/confirm-dialog-actions.svelte';

	// UTILS
	import { toastMessage } from '@/utils/toastMessage.js';

	// TYPES
	import type { AdminAccommodationsFeeDialogAccommodation } from '../admin-accommodations-fee-dialog/adminAccommodationsFeeDialogTypes.js';
	import type { Id } from '@convex/_generated/dataModel.js';

	let { accommodation }: { accommodation: AdminAccommodationsFeeDialogAccommodation } = $props();
	const titleId = $props.id();
	let pending = $state(false);
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
	const refund = useAction(
		api.tables.accommodationFeePayments.actions.refundAccommodationFee.refundAccommodationFee
	);
	const isReviewedPaymentCurrent = $derived(
		eligible && payment?._id === reviewedPaymentId && remaining === reviewedAmount
	);

	async function refundFee(close: () => void) {
		const paymentId = reviewedPaymentId;
		const expectedAmountMinor = reviewedAmount;
		const canSubmitRefund = !pending && paymentId !== null && expectedAmountMinor > 0;
		if (!canSubmitRefund) return;
		pending = true;
		try {
			await refund({
				paymentId,
				expectedAmountMinor
			});
			close();
			toastMessage({
				type: 'success',
				message: m['AdminAccommodationsPage.AdminAccommodationsRefundFeeDialog.saved']()
			});
		} catch (error) {
			toastMessage({ type: 'error', error, message: m['ErrorMessages.unexpected']() });
		} finally {
			pending = false;
		}
	}
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
		{#if eligible}
			<Button
				type="button"
				variant="destructive"
				size="sm"
				disabled={pending}
				commandfor={id}
				command="show-modal"
			>
				{m['AdminAccommodationsPage.AdminAccommodationsRefundFeeDialog.trigger']()}
			</Button>
		{/if}
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
			<ConfirmDialogActions
				{pending}
				cancelCommandFor={id}
				cancelLabel={m['AdminAccommodationsPage.AdminAccommodationsRefundFeeDialog.cancel']()}
				confirmLabel={m['AdminAccommodationsPage.AdminAccommodationsRefundFeeDialog.trigger']()}
				confirmDisabled={!isReviewedPaymentCurrent}
				onConfirm={() => refundFee(close)}
			/>
		</div>
	{/snippet}
</NativeDialog>
