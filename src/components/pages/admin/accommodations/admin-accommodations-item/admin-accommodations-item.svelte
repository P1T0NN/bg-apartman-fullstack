<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages.js';
	import { getLocale } from '@/lib/paraglide/runtime.js';
	import { api } from '@convex/_generated/api.js';

	// COMPONENTS
	import { Badge } from '@/components/ui/badge/index.js';
	import { TableCell } from '@/components/ui/table/index.js';
	import { Separator } from '@/components/ui/separator/index.js';
	import CopyValue from '@/components/ui/custom-components/copy-value/copy-value.svelte';
	import NativePopover from '@/components/ui/native-components/native-popover/native-popover.svelte';
	import AdminAccommodationsFeeDialog from './admin-accommodations-fee-dialog/admin-accommodations-fee-dialog.svelte';
	import AdminAccommodationsLoyaltyDialog from './admin-accommodations-loyalty-dialog/admin-accommodations-loyalty-dialog.svelte';
	import AdminAccommodationsRefundFeeDialog from './admin-accommodations-refund-fee-dialog/admin-accommodations-refund-fee-dialog.svelte';
	import AccommodationLocation from '@/features/accommodations/components/accommodation-location/accommodation-location.svelte';

	// UTILS
	import { isAccommodationVisible } from '@/shared/features/accommodations/utils/isAccommodationVisible.js';
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { FunctionReturnType } from 'convex/server';

	let {
		accommodation
	}: {
		accommodation: FunctionReturnType<
			typeof api.tables.accommodations.queries.fetchAccommodationsAdmin.fetchAccommodationsAdmin
		>['items'][number];
	} = $props();

	const visible = $derived(isAccommodationVisible(accommodation));
	const expired = $derived(
		accommodation.billingPlanId === 'flat_fee' &&
			accommodation.billingPeriodEndsAt !== null &&
			accommodation.billingPeriodEndsAt <= Date.now()
	);

	let feeDialog: AdminAccommodationsFeeDialog;
	let loyaltyDialog: AdminAccommodationsLoyaltyDialog;
</script>

{#snippet actionsTrigger()}
	<span class="icon-[lucide--ellipsis] size-5" aria-hidden="true"></span>
{/snippet}

<TableCell class="py-4 whitespace-normal">
	<div class="flex flex-col gap-1">
		<p class="font-semibold wrap-anywhere">{accommodation.name}</p>
		<p class="text-xs text-muted-foreground">
			<AccommodationLocation
				city={accommodation.address.city}
				country={accommodation.address.country}
			/>
		</p>

		<div class="text-xs">
			<CopyValue
				label={m['AdminAccommodationsPage.AdminAccommodationsItem.id']()}
				value={accommodation._id}
			/>
		</div>
	</div>
</TableCell>

<TableCell class="whitespace-normal">
	<div class="text-xs">
		<CopyValue
			label={m['AdminAccommodationsPage.AdminAccommodationsItem.owner']()}
			value={accommodation.ownerId}
		/>
	</div>
</TableCell>

<TableCell>
	<Badge
		variant="outline"
		class={cn(
			visible
				? 'border-success/30 bg-success/10 text-success'
				: 'border-border bg-muted text-muted-foreground'
		)}
	>
		{accommodation.status === 'deleted'
			? m['AdminAccommodationsPage.AdminAccommodationsItem.deleted']()
			: accommodation.status === 'unpublished'
				? m['AdminAccommodationsPage.AdminAccommodationsItem.paused']()
				: visible
					? m['AdminAccommodationsPage.AdminAccommodationsItem.visible']()
					: m['AdminAccommodationsPage.AdminAccommodationsItem.hidden']()}
	</Badge>
</TableCell>

<TableCell>
	<Badge
		variant="outline"
		class={cn(
			expired
				? 'border-destructive/30 bg-destructive/10 text-destructive'
				: accommodation.billingStatus === 'active'
					? 'border-success/30 bg-success/10 text-success'
					: 'border-warning/30 bg-warning/10 text-warning'
		)}
	>
		{expired
			? m['AdminAccommodationsPage.AdminAccommodationsItem.expired']()
			: accommodation.billingStatus === 'active'
				? m['AdminAccommodationsPage.AdminAccommodationsItem.active']()
				: m['AdminAccommodationsPage.AdminAccommodationsItem.paymentRequired']()}
	</Badge>
</TableCell>

<TableCell class="whitespace-normal">
	<div class="flex flex-col gap-1">
		{#if accommodation.billingTerms.model === 'flat_fee'}
			<p class="font-medium">{m['AdminAccommodationsPage.AdminAccommodationsItem.flatFee']()}</p>
			<p class="text-xs text-muted-foreground">
				{m['AdminAccommodationsPage.AdminAccommodationsItem.flatPrice']({
					amount: new Intl.NumberFormat(getLocale(), {
						style: 'currency',
						currency: accommodation.billingTerms.currency
					}).format(accommodation.billingTerms.amountMinor / 100),
					months: accommodation.billingTerms.intervalMonths
				})}
			</p>
		{:else if accommodation.billingTerms.model === 'booking_fee'}
			<p class="font-medium">{m['AdminAccommodationsPage.AdminAccommodationsItem.bookingFee']()}</p>
			<p class="text-xs text-muted-foreground">
				{m['AdminAccommodationsPage.AdminAccommodationsItem.commission']({
					percent: accommodation.billingTerms.commissionBps / 100
				})}
			</p>
		{:else}
			<p class="font-medium">{m['AdminAccommodationsPage.AdminAccommodationsItem.free']()}</p>
			<p class="text-xs text-muted-foreground">
				{m['AdminAccommodationsPage.AdminAccommodationsItem.noFees']()}
			</p>
		{/if}
	</div>
</TableCell>

<TableCell class="whitespace-normal">
	{#if accommodation.billingPeriodEndsAt !== null}
		<time datetime={new Date(accommodation.billingPeriodEndsAt).toISOString()}>
			{new Intl.DateTimeFormat(getLocale(), { dateStyle: 'medium', timeStyle: 'short' }).format(
				accommodation.billingPeriodEndsAt
			)}
		</time>
	{:else if accommodation.billingPlanId === 'free'}
		{m['AdminAccommodationsPage.AdminAccommodationsItem.forever']()}
	{:else}
		<span class="text-muted-foreground">&mdash;</span>
	{/if}
</TableCell>

<TableCell>
	<div class="flex items-center justify-end gap-2">
		<!-- Keep the modals outside the popover so closing the menu cannot hide the dialogs. -->
		<AdminAccommodationsRefundFeeDialog {accommodation}>
			{#snippet trigger({ id, eligible })}
				<NativePopover
					id={`accommodation-actions-${accommodation._id}`}
					trigger={actionsTrigger}
					triggerLabel={m['AdminAccommodationsPage.columns.actions']()}
					triggerClass="size-9 justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
				>
					<button
						type="button"
						class="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
						disabled={accommodation.status === 'deleted'}
						onclick={(event) => {
							event.currentTarget.closest<HTMLElement>('[popover]')?.hidePopover();
							feeDialog.open();
						}}
					>
						<span class="icon-[lucide--receipt-text] size-4" aria-hidden="true"></span>
						{m['AdminAccommodationsPage.AdminAccommodationsFeeDialog.trigger']()}
					</button>
					<button
						type="button"
						class="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
						disabled={accommodation.status === 'deleted'}
						onclick={(event) => {
							event.currentTarget.closest<HTMLElement>('[popover]')?.hidePopover();
							loyaltyDialog.open();
						}}
					>
						<span class="icon-[lucide--gift] size-4" aria-hidden="true"></span>
						{m['AdminAccommodationsPage.AdminAccommodationsLoyaltyDialog.trigger']()}
					</button>
					{#if eligible}
						<Separator class="my-1" />
						<button
							type="button"
							class="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-destructive transition-colors hover:bg-destructive/10 focus-visible:ring-2 focus-visible:ring-destructive/30 focus-visible:outline-none"
							commandfor={id}
							command="show-modal"
							onclick={(event) =>
								event.currentTarget.closest<HTMLElement>('[popover]')?.hidePopover()}
						>
							<span class="icon-[lucide--undo-2] size-4" aria-hidden="true"></span>
							{m['AdminAccommodationsPage.AdminAccommodationsRefundFeeDialog.trigger']()}
						</button>
					{/if}
				</NativePopover>
			{/snippet}
		</AdminAccommodationsRefundFeeDialog>

		<AdminAccommodationsFeeDialog bind:this={feeDialog} {accommodation} />
		<AdminAccommodationsLoyaltyDialog bind:this={loyaltyDialog} {accommodation} />
	</div>
</TableCell>
