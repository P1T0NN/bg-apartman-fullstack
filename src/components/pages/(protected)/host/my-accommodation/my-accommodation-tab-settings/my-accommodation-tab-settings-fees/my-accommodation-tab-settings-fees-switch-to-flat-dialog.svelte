<script lang="ts">
	// LIBRARIES
	import { useMutation } from 'convex-svelte';

	// SVELTEKIT IMPORTS
	import { page } from '$app/state';

	// MESSAGES
	import { m } from '@/lib/paraglide/messages.js';
	import { getLocale } from '@/lib/paraglide/runtime.js';

	// CONVEX
	import { api } from '@convex/_generated/api.js';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import NativeDialog from '@/components/ui/native-components/native-dialog/native-dialog.svelte';
	import ConfirmDialogActions from '@/components/ui/custom-components/confirm-dialog-actions/confirm-dialog-actions.svelte';

	// CONFIG
	import { ACCOMMODATION_BILLING_PLANS } from '@/shared/features/accommodations/config.js';

	// UTILS
	import { toastMessage } from '@/utils/toastMessage.js';

	// TYPES
	import type { Doc, Id } from '@convex/_generated/dataModel.js';

	let { billingPlanId }: { billingPlanId: Doc<'accommodations'>['billingPlanId'] } = $props();
	const titleId = $props.id();
	const changePlan = useMutation(
		api.tables.accommodations.mutations.changeAccommodationBillingPlan
			.changeAccommodationBillingPlan
	);
	const flatPrice = $derived(
		new Intl.NumberFormat(getLocale(), {
			style: 'currency',
			currency: ACCOMMODATION_BILLING_PLANS.flat_fee.currency
		}).format(ACCOMMODATION_BILLING_PLANS.flat_fee.amountMinor / 100)
	);
	let pending = $state(false);
	let reviewedPlan = $state<Doc<'accommodations'>['billingPlanId']>('booking_fee');

	async function switchToFlatFee(close: () => void) {
		if (pending) return;
		pending = true;
		try {
			await changePlan({
				// SAFETY: Convex validates the untrusted route ID and checks ownership.
				id: page.params.id as Id<'accommodations'>,
				billingPlanId: 'flat_fee',
				expectedBillingPlanId: reviewedPlan
			});
			close();
			toastMessage({
				type: 'success',
				message:
					m['MyAccommodationPage.MyAccommodationTabSettingsFeesSwitchToFlatDialog.updatedHidden']()
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
		if (event.newState === 'open') reviewedPlan = billingPlanId;
	}}
>
	{#snippet trigger({ id })}
		<Button type="button" variant="outline" disabled={pending} commandfor={id} command="show-modal">
			{m['MyAccommodationPage.MyAccommodationTabSettingsFeesSwitchToFlatDialog.switchToFlat']()}
		</Button>
	{/snippet}
	{#snippet children({ id, close })}
		<div class="flex flex-col gap-5 p-6">
			<h3 id={titleId} class="text-lg font-semibold">
				{m[
					'MyAccommodationPage.MyAccommodationTabSettingsFeesSwitchToFlatDialog.confirmationTitle'
				]()}
			</h3>
			<p class="text-sm leading-relaxed text-muted-foreground">
				{m['MyAccommodationPage.MyAccommodationTabSettingsFeesSwitchToFlatDialog.confirmationHint'](
					{
						amount: flatPrice,
						months: ACCOMMODATION_BILLING_PLANS.flat_fee.intervalMonths
					}
				)}
			</p>
			<ConfirmDialogActions
				{pending}
				cancelLabel={m[
					'MyAccommodationPage.MyAccommodationTabSettingsFeesSwitchToFlatDialog.cancel'
				]()}
				confirmLabel={m[
					'MyAccommodationPage.MyAccommodationTabSettingsFeesSwitchToFlatDialog.confirm'
				]()}
				cancelCommandFor={id}
				onConfirm={() => switchToFlatFee(close)}
				confirmDisabled={billingPlanId !== reviewedPlan}
			/>
		</div>
	{/snippet}
</NativeDialog>
