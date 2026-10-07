<script lang="ts">
	// MESSAGES
	import { m } from '@/lib/paraglide/messages.js';
	import { getLocale } from '@/lib/paraglide/runtime.js';

	// COMPONENTS
	import { Badge } from '@/components/ui/badge/index.js';
	import { Button } from '@/components/ui/button/index.js';
	import { TableCell } from '@/components/ui/table/index.js';
	import AccommodationPrice from '@/features/accommodations/components/accommodation-price/accommodation-price.svelte';
	import AccommodationLocation from '@/features/accommodations/components/accommodation-location/accommodation-location.svelte';
	import AccommodationFlatFeePaymentButton from '@/features/accommodations/components/accommodation-flat-fee-payment-button/accommodation-flat-fee-payment-button.svelte';

	// CONFIG
	import { PROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// HOOKS
	import { useClock } from '@/hooks/useClock.svelte.js';

	// UTILS
	import { isAccommodationVisible } from '@/shared/features/accommodations/utils/isAccommodationVisible.js';

	// TYPES
	import type { MyAccommodationCard } from '@/shared/features/accommodations/types/accommodationTypes.js';

	let {
		accommodation,
		layout
	}: {
		accommodation: MyAccommodationCard;
		layout: 'table' | 'stacked';
	} = $props();

	const clock = useClock();
	const titleId = $props.id();
	const coverUrl = $derived(accommodation.imageUrls[0]);
	const isVisible = $derived(isAccommodationVisible(accommodation, clock.now));
	const isExpired = $derived(
		accommodation.billingPlanId === 'flat_fee' &&
			accommodation.billingPeriodEndsAt !== null &&
			accommodation.billingPeriodEndsAt <= clock.now
	);
	const requiresPayment = $derived(
		accommodation.billingPlanId === 'flat_fee' &&
			(accommodation.billingStatus === 'pending_payment' ||
				accommodation.billingPeriodEndsAt === null ||
				isExpired)
	);
	const visibility = $derived(
		accommodation.status !== 'published'
			? 'paused'
			: isExpired
				? 'expired'
				: isVisible
					? 'visible'
					: 'paymentRequired'
	);
	const VISIBILITY_LABELS = {
		visible: () => m['MyAccommodationsPage.MyAccommodationItem.visible'](),
		paused: () => m['MyAccommodationsPage.MyAccommodationItem.paused'](),
		expired: () => m['MyAccommodationsPage.MyAccommodationItem.expired'](),
		paymentRequired: () => m['MyAccommodationsPage.MyAccommodationItem.paymentRequired']()
	};
	const VISIBILITY_CLASSES = {
		visible: 'border-success/30 bg-success/10 text-success',
		paused: 'border-border bg-muted text-muted-foreground',
		expired: 'border-destructive/30 bg-destructive/10 text-destructive',
		paymentRequired: 'border-warning/30 bg-warning/10 text-warning'
	} satisfies Record<keyof typeof VISIBILITY_LABELS, string>;
	let failedImageUrl = $state('');
	let pending = $state(false);
</script>

{#snippet property()}
	<div class="flex min-w-0 items-center gap-3">
		<div class="size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
			{#if coverUrl && failedImageUrl !== coverUrl}
				<img
					src={coverUrl}
					alt=""
					width="56"
					height="56"
					loading="lazy"
					decoding="async"
					class="size-full object-cover"
					onerror={() => (failedImageUrl = coverUrl)}
				/>
			{:else}
				<span
					class="flex size-full items-center justify-center text-muted-foreground"
					aria-hidden="true"
				>
					<span class="icon-[lucide--house] size-5"></span>
				</span>
			{/if}
		</div>
		<div class="flex min-w-0 flex-col gap-1">
			<h2 id={titleId} class="text-sm font-semibold wrap-anywhere">{accommodation.name}</h2>
			<p class="text-sm text-muted-foreground">
				<AccommodationLocation
					city={accommodation.address.city}
					country={accommodation.address.country}
				/>
			</p>
		</div>
	</div>
{/snippet}

{#snippet visibilityBadge()}
	<Badge variant="outline" class={VISIBILITY_CLASSES[visibility]}>
		{VISIBILITY_LABELS[visibility]()}
	</Badge>
{/snippet}

{#snippet feePlan()}
	<div class="flex flex-col gap-1">
		<p class="font-medium">
			{accommodation.billingPlanId === 'free'
				? m['MyAccommodationsPage.MyAccommodationItem.free']()
				: accommodation.billingPlanId === 'flat_fee'
					? m['MyAccommodationsPage.MyAccommodationItem.flatFee']()
					: m['MyAccommodationsPage.MyAccommodationItem.bookingFee']()}
		</p>
		{#if accommodation.billingTerms.model === 'flat_fee'}
			<p class="text-xs text-muted-foreground">
				{m['MyAccommodationsPage.MyAccommodationItem.flatPrice']({
					amount: new Intl.NumberFormat(getLocale(), {
						style: 'currency',
						currency: accommodation.billingTerms.currency
					}).format(accommodation.billingTerms.amountMinor / 100),
					months: accommodation.billingTerms.intervalMonths
				})}
			</p>
		{:else if accommodation.billingTerms.model === 'booking_fee'}
			<p class="text-xs text-muted-foreground">
				{m['MyAccommodationsPage.MyAccommodationItem.bookingRate']({
					percent: accommodation.billingTerms.commissionBps / 100
				})}
			</p>
		{/if}
		{#if accommodation.billingPlanId === 'free'}
			<p class="text-xs text-muted-foreground">
				{m['MyAccommodationsPage.MyAccommodationItem.noFees']()}
			</p>
		{/if}
	</div>
{/snippet}

{#snippet nightlyPrice()}
	<div class="flex flex-col gap-1">
		<AccommodationPrice pricing={accommodation} />
		<span class="text-xs text-muted-foreground">
			{m['MyAccommodationsPage.MyAccommodationItem.perNight']()}
		</span>
	</div>
{/snippet}

{#snippet paidUntil()}
	{#if accommodation.billingPeriodEndsAt !== null}
		<time datetime={new Date(accommodation.billingPeriodEndsAt).toISOString()}>
			{new Intl.DateTimeFormat(getLocale(), { dateStyle: 'medium' }).format(
				accommodation.billingPeriodEndsAt
			)}
		</time>
	{:else if accommodation.billingPlanId === 'free'}
		<span>{m['MyAccommodationsPage.MyAccommodationItem.forever']()}</span>
	{:else}
		<span
			class="text-muted-foreground"
			aria-label={m['MyAccommodationsPage.MyAccommodationItem.noPaidPeriod']()}
		>
			&mdash;
		</span>
	{/if}
{/snippet}

{#snippet actions()}
	<div class="flex flex-wrap items-center gap-2 xl:justify-end">
		{#if requiresPayment}
			<AccommodationFlatFeePaymentButton
				accommodationId={accommodation._id}
				{isExpired}
				bind:pending
			/>
		{/if}
		<Button
			href={PROTECTED_PAGE_ENDPOINTS.MY_ACCOMMODATION(accommodation._id)}
			variant="default"
			disabled={pending}
			aria-label={m['MyAccommodationsPage.MyAccommodationItem.manageLabel']({
				name: accommodation.name
			})}
		>
			{m['MyAccommodationsPage.MyAccommodationItem.manage']()}
		</Button>
	</div>
{/snippet}

{#if layout === 'stacked'}
	<article
		aria-labelledby={titleId}
		class="flex min-w-0 flex-col gap-4 rounded-xl border p-4 sm:p-5"
	>
		{@render property()}
		<div>{@render visibilityBadge()}</div>
		<dl class="grid grid-cols-2 gap-4">
			<div class="flex flex-col gap-1">
				<dt class="text-xs text-muted-foreground">{m['MyAccommodationsPage.columns.feePlan']()}</dt>
				<dd>{@render feePlan()}</dd>
			</div>
			<div class="flex flex-col gap-1">
				<dt class="text-xs text-muted-foreground">
					{m['MyAccommodationsPage.columns.nightlyPrice']()}
				</dt>
				<dd>{@render nightlyPrice()}</dd>
			</div>
			<div class="col-span-2 flex flex-col gap-1">
				<dt class="text-xs text-muted-foreground">
					{m['MyAccommodationsPage.columns.paidUntil']()}
				</dt>
				<dd class="text-sm">{@render paidUntil()}</dd>
			</div>
		</dl>
		<div class="border-t pt-4">{@render actions()}</div>
	</article>
{:else}
	<TableCell class="py-4 whitespace-normal">{@render property()}</TableCell>
	<TableCell class="py-4">{@render visibilityBadge()}</TableCell>
	<TableCell class="py-4 whitespace-normal">{@render feePlan()}</TableCell>
	<TableCell class="py-4 whitespace-normal">{@render nightlyPrice()}</TableCell>
	<TableCell class="py-4 whitespace-normal">{@render paidUntil()}</TableCell>
	<TableCell class="py-4 whitespace-normal">{@render actions()}</TableCell>
{/if}
