<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// UTILS
	import { cn } from '@/utils/utils.js';

	const id = $props.id();

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

<div class="mt-3 text-xs leading-5 text-muted-foreground">
	<p id={`${id}-legend`} class="font-medium text-foreground">
		{m['BookingsFeature.BookingStayDatesLegend.legend']()}
	</p>

	<ul aria-labelledby={`${id}-legend`} class="mt-2 flex flex-wrap gap-x-4 gap-y-2">
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
	
	<p class="mt-2">{m['BookingsFeature.BookingStayDatesLegend.availabilityHint']()}</p>
</div>
