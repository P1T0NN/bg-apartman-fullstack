<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime.js';
	import InfoIcon from '@lucide/svelte/icons/info';
	import * as Alert from '@/components/ui/alert/index.js';

	// UTILS
	import { calculateDiscountedPrice } from '@/shared/features/accommodations/utils/calculateAccommodationPricing.js';
	import { formatCurrency } from '@/shared/utils/currency.js';
	import { cn } from '@/utils/utils.js';

	import type { PublicAccommodation } from '@/shared/features/accommodations/types/accommodationTypes.js';

	let { accommodation }: { accommodation: PublicAccommodation } = $props();

	const id = $props.id();
	const weekendRate = $derived(
		accommodation.weekendPricePerNightMinor === null
			? null
			: calculateDiscountedPrice(accommodation.weekendPricePerNightMinor, accommodation.discountBps)
	);
	const hasDifferentWeekendRate = $derived(
		weekendRate !== null && weekendRate !== accommodation.effectivePricePerNightMinor
	);

	const legend = $derived([
		{
			label: m['BookingsFeature.BookingStayDatesLegend.selectable'](),
			class: 'border border-border bg-background'
		},
		{ label: m['BookingsFeature.BookingStayDatesLegend.arrivalDeparture'](), class: 'bg-primary' },
		{
			label: m['BookingsFeature.BookingStayDatesLegend.selectedNights'](),
			class: 'border border-border bg-accent'
		},
		{
			label: m['BookingsFeature.BookingStayDatesLegend.today'](),
			class: 'border border-foreground bg-accent'
		},
		{
			label: m['BookingsFeature.BookingStayDatesLegend.tooEarly'](),
			class: 'bg-muted-foreground/30'
		},
		{
			label: m['BookingsFeature.BookingStayDatesLegend.unavailable'](),
			class: 'rounded-sm border border-destructive bg-destructive/15 text-destructive',
			crossedOut: true
		}
	]);
</script>

<div class="mt-5 text-xs leading-5 text-muted-foreground">
	<p id={`${id}-legend`} class="font-medium text-foreground">
		{m['BookingsFeature.BookingStayDatesLegend.legend']()}
	</p>

	<ul aria-labelledby={`${id}-legend`} class="mt-2 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
		{#each legend as item (item.label)}
			<li class="flex items-center gap-2">
				<span class={cn('relative size-3 shrink-0 rounded-full', item.class)} aria-hidden="true">
					{#if item.crossedOut}
						<span class="absolute top-1/2 left-0 h-px w-full -rotate-45 bg-destructive"></span>
					{/if}
				</span>
				{item.label}
			</li>
		{/each}
	</ul>

	<div class="mt-5 flex flex-col gap-3">
		{#if hasDifferentWeekendRate && weekendRate !== null}
			<Alert.Root role="note" class="md:hidden">
				<InfoIcon aria-hidden="true" />
				<Alert.Description>
					{m['BookingsFeature.BookingStayDatesLegend.weekendRate']({
						price: formatCurrency(weekendRate, getLocale())
					})}
				</Alert.Description>
			</Alert.Root>
		{/if}
		<Alert.Root role="note">
			<InfoIcon aria-hidden="true" />
			<Alert.Description>
				{accommodation.sameDayReservation
					? m['BookingPage.BookCheckoutForm.sameDayAvailable']({
							time: accommodation.checkInStart
						})
					: m['BookingPage.BookCheckoutForm.sameDayUnavailable']()}
			</Alert.Description>
		</Alert.Root>
		<Alert.Root role="note">
			<InfoIcon aria-hidden="true" />
			<Alert.Description>
				{m['BookingPage.BookCheckoutForm.minimumStay']({ count: accommodation.minimumStay })}
			</Alert.Description>
		</Alert.Root>
		{#if accommodation.maximumStay !== undefined}
			<Alert.Root role="note">
				<InfoIcon aria-hidden="true" />
				<Alert.Description>
					{m['BookingPage.BookCheckoutForm.maximumStay']({ count: accommodation.maximumStay })}
				</Alert.Description>
			</Alert.Root>
		{/if}
		<Alert.Root role="note">
			<InfoIcon aria-hidden="true" />
			<Alert.Description>
				{m['BookingPage.BookCheckoutForm.timeZone']({ timeZone: accommodation.timeZone })}
			</Alert.Description>
		</Alert.Root>
	</div>
</div>
