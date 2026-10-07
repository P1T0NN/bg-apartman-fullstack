<script lang="ts">
	// LIBRARIES
	import { useMutation } from 'convex-svelte';

	// MESSAGES
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

	let { accommodation }: { accommodation: AdminAccommodationsFeeDialogAccommodation } = $props();
	const titleId = $props.id();
	let pending = $state(false);
	let reviewedPeriod = $state<number | null>(null);
	let reviewedUpdatedAt = $state<number | null>(null);
	const eligible = $derived(
		accommodation.status !== 'deleted' &&
			accommodation.billingPlanId === 'flat_fee' &&
			accommodation.billingStatus === 'active' &&
			accommodation.billingPeriodEndsAt !== null &&
			accommodation.billingPeriodEndsAt > Date.now()
	);
	const refund = useMutation(
		api.tables.accommodations.mutations.refundFlatFeeForAccommodation.refundFlatFeeForAccommodation
	);

	async function refundFee(close: () => void) {
		if (pending || reviewedPeriod === null || reviewedUpdatedAt === null) return;
		pending = true;
		try {
			await refund({
				id: accommodation._id,
				expectedBillingPeriodEndsAt: reviewedPeriod,
				expectedUpdatedAt: reviewedUpdatedAt
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
			reviewedPeriod = accommodation.billingPeriodEndsAt;
			reviewedUpdatedAt = accommodation.updatedAt;
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
			<ConfirmDialogActions
				{pending}
				cancelCommandFor={id}
				cancelLabel={m['AdminAccommodationsPage.AdminAccommodationsRefundFeeDialog.cancel']()}
				confirmLabel={m['AdminAccommodationsPage.AdminAccommodationsRefundFeeDialog.trigger']()}
				confirmDisabled={!eligible ||
					accommodation.billingPeriodEndsAt !== reviewedPeriod ||
					accommodation.updatedAt !== reviewedUpdatedAt}
				onConfirm={() => refundFee(close)}
			/>
		</div>
	{/snippet}
</NativeDialog>
