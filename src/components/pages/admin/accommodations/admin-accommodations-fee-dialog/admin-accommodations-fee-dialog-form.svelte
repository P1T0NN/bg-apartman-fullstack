<script lang="ts">
	// LIBRARIES
	import { untrack } from 'svelte';

	// MESSAGES
	import { m } from '@/lib/paraglide/messages.js';

	// COMPONENTS
	import NativeSelect from '@/components/ui/native-components/native-select/native-select.svelte';
	import { Input } from '@/components/ui/input/index.js';
	import { Button } from '@/components/ui/button/index.js';
	import * as Field from '@/components/ui/field/index.js';
	import AdminAccommodationsFeeDialogSaveButton from './admin-accommodations-fee-dialog-save-button.svelte';

	// CONFIG
	import { ACCOMMODATION_BILLING_PLANS } from '@/shared/features/accommodations/config.js';

	// TYPES
	import type {
		AdminAccommodationsFeeDialogDraft,
		AdminAccommodationsFeeDialogAccommodation
	} from './adminAccommodationsFeeDialogTypes.js';

	let {
		accommodation,
		dialogId,
		close,
		pending = $bindable(false)
	}: {
		accommodation: AdminAccommodationsFeeDialogAccommodation;
		dialogId: string;
		close: () => void;
		pending: boolean;
	} = $props();

	const fieldsId = $props.id();

	// The dialog recreates this editor on each opening to load the current terms.
	const initial = untrack(() => accommodation);

	const terms = initial.billingTerms;
	const date = initial.billingPeriodEndsAt === null ? null : new Date(initial.billingPeriodEndsAt);

	let draft = $state<AdminAccommodationsFeeDialogDraft>({
		id: initial._id,
		plan: initial.billingPlanId,
		status: initial.billingStatus,
		amount:
			terms.model === 'flat_fee'
				? terms.amountMinor / 100
				: ACCOMMODATION_BILLING_PLANS.flat_fee.amountMinor / 100,
		months:
			terms.model === 'flat_fee'
				? terms.intervalMonths
				: ACCOMMODATION_BILLING_PLANS.flat_fee.intervalMonths,
		commission:
			terms.model === 'booking_fee'
				? terms.commissionBps / 100
				: ACCOMMODATION_BILLING_PLANS.booking_fee.commissionBps / 100,
		forever: date === null,
		deadline:
			date === null
				? ''
				: new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
	});
</script>

<div class="flex flex-col gap-5">
	<Field.Group>
		<Field.Field>
			<NativeSelect
				includePlaceholderOption={false}
				bind:value={draft.plan}
				disabled={pending}
				label={m['AdminAccommodationsPage.AdminAccommodationsFeeDialogForm.plan']()}
				options={[
					{
						value: 'booking_fee',
						label: m['AdminAccommodationsPage.AdminAccommodationsFeeDialogForm.bookingFee']()
					},
					{
						value: 'flat_fee',
						label: m['AdminAccommodationsPage.AdminAccommodationsFeeDialogForm.flatFee']()
					},
					{
						value: 'free',
						label: m['AdminAccommodationsPage.AdminAccommodationsFeeDialogForm.free']()
					}
				]}
			/>
		</Field.Field>

		{#if draft.plan === 'booking_fee'}
			<Field.Field>
				<Field.Label for={`${fieldsId}-commission`}>
					{m['AdminAccommodationsPage.AdminAccommodationsFeeDialogForm.commission']()}
				</Field.Label>
				<Input
					id={`${fieldsId}-commission`}
					type="number"
					min="0"
					max="100"
					step="0.01"
					bind:value={draft.commission}
					required
					disabled={pending}
				/>
				<Field.Description>
					{m['AdminAccommodationsPage.AdminAccommodationsFeeDialogForm.commissionHint']()}
				</Field.Description>
			</Field.Field>
		{:else if draft.plan === 'flat_fee'}
			<Field.Field>
				<Field.Label for={`${fieldsId}-amount`}>
					{m['AdminAccommodationsPage.AdminAccommodationsFeeDialogForm.amount']()}
				</Field.Label>
				<Input
					id={`${fieldsId}-amount`}
					type="number"
					min="0.01"
					step="0.01"
					bind:value={draft.amount}
					required
					disabled={pending}
				/>
			</Field.Field>

			<Field.Field>
				<Field.Label for={`${fieldsId}-months`}>
					{m['AdminAccommodationsPage.AdminAccommodationsFeeDialogForm.months']()}
				</Field.Label>
				<Input
					id={`${fieldsId}-months`}
					type="number"
					min="1"
					max="120"
					step="1"
					bind:value={draft.months}
					required
					disabled={pending}
				/>
			</Field.Field>

			<Field.Field>
				<NativeSelect
					includePlaceholderOption={false}
					bind:value={draft.status}
					disabled={pending}
					label={m['AdminAccommodationsPage.AdminAccommodationsFeeDialogForm.status']()}
					options={[
						{
							value: 'pending_payment',
							label: m['AdminAccommodationsPage.AdminAccommodationsFeeDialogForm.pendingPayment']()
						},
						{
							value: 'active',
							label: m['AdminAccommodationsPage.AdminAccommodationsFeeDialogForm.active']()
						}
					]}
				/>
			</Field.Field>
		{:else}
			<Field.Field>
				<Field.Label for={`${fieldsId}-forever`}>
					<input
						id={`${fieldsId}-forever`}
						type="checkbox"
						bind:checked={draft.forever}
						disabled={pending}
					/>
					{m['AdminAccommodationsPage.AdminAccommodationsFeeDialogForm.forever']()}
				</Field.Label>
				<Field.Description>
					{m['AdminAccommodationsPage.AdminAccommodationsFeeDialogForm.freeHint']()}
				</Field.Description>
			</Field.Field>
		{/if}

		{#if draft.plan === 'flat_fee' || (draft.plan === 'free' && !draft.forever)}
			<Field.Field>
				<Field.Label for={`${fieldsId}-deadline`}>
					{m['AdminAccommodationsPage.AdminAccommodationsFeeDialogForm.deadline']()}
				</Field.Label>
				<Input
					id={`${fieldsId}-deadline`}
					type="datetime-local"
					bind:value={draft.deadline}
					required={draft.plan === 'free' || draft.status === 'active'}
					disabled={pending}
				/>
			</Field.Field>
		{/if}
	</Field.Group>

	<div class="flex justify-end gap-2">
		<Button
			type="button"
			variant="outline"
			disabled={pending}
			commandfor={dialogId}
			command="close"
		>
			{m['AdminAccommodationsPage.AdminAccommodationsFeeDialogForm.cancel']()}
		</Button>

		<AdminAccommodationsFeeDialogSaveButton {draft} {close} bind:pending />
	</div>
</div>
