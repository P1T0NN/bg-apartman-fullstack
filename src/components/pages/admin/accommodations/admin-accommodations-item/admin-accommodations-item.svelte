<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages.js';
	import { getLocale } from '@/lib/paraglide/runtime.js';

	// COMPONENTS
	import { Badge } from '@/components/ui/badge/index.js';
	import { TableCell } from '@/components/ui/table/index.js';
	import CopyValue from '@/components/ui/custom-components/copy-value/copy-value.svelte';
	import AdminAccommodationsFeeDialog from '../admin-accommodations-fee-dialog/admin-accommodations-fee-dialog.svelte';
	import AdminAccommodationsRefundFeeDialog from '../admin-accommodations-refund-fee-dialog/admin-accommodations-refund-fee-dialog.svelte';
	import AccommodationLocation from '@/features/accommodations/components/accommodation-location/accommodation-location.svelte';

	// UTILS
	import { isAccommodationVisible } from '@/shared/features/accommodations/utils/isAccommodationVisible.js';
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { FunctionReturnType } from 'convex/server';
	import type { api } from '@convex/_generated/api.js';

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
</script>

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
	<div class="flex flex-wrap justify-end gap-2">
		<AdminAccommodationsFeeDialog {accommodation} />
		<AdminAccommodationsRefundFeeDialog {accommodation} />
	</div>
</TableCell>
