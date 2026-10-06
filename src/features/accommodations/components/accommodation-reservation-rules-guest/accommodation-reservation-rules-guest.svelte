<script lang="ts">
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime.js';
	import Plural from '@/components/ui/custom-components/plural/plural.svelte';
	import * as Alert from '@/components/ui/alert/index.js';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import type { PublicAccommodation } from '@/shared/features/accommodations/types/accommodationTypes.js';

	let { accommodation }: { accommodation: PublicAccommodation } = $props();
	const id = $props.id();
</script>

<section class="border-t pt-7" aria-labelledby={`${id}-title`}>
	<h3 id={`${id}-title`} class="text-xl font-semibold tracking-tight">
		{m['AccommodationsFeature.ReservationRulesGuest.title']()}
	</h3>
	<p class="mt-2 max-w-prose text-sm leading-6 text-muted-foreground">
		{m['AccommodationsFeature.ReservationRulesGuest.overnightRequired']()}
	</p>

	<dl class="my-6 grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
		<div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
			<dt class="text-muted-foreground">
				{m['AccommodationsFeature.ReservationRulesGuest.minimumStay']()}
			</dt>
			<dd class="font-medium">
				<Plural
					count={accommodation.minimumStay}
					locale={getLocale()}
					forms={{
						one: m['AccommodationsFeature.ReservationRulesGuest.night'](),
						other: m['AccommodationsFeature.ReservationRulesGuest.nights']()
					}}
				/>
			</dd>
		</div>
		{#if accommodation.maximumStay}
			<div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
				<dt class="text-muted-foreground">
					{m['AccommodationsFeature.ReservationRulesGuest.maximumStay']()}
				</dt>
				<dd class="font-medium">
					<Plural
						count={accommodation.maximumStay}
						locale={getLocale()}
						forms={{
							one: m['AccommodationsFeature.ReservationRulesGuest.night'](),
							other: m['AccommodationsFeature.ReservationRulesGuest.nights']()
						}}
					/>
				</dd>
			</div>
		{/if}
		<div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
			<dt class="text-muted-foreground">
				{m['AccommodationsFeature.ReservationRulesGuest.guestLimit']()}
			</dt>
			<dd class="font-medium tabular-nums">{accommodation.maxGuests}</dd>
		</div>
		<div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
			<dt class="text-muted-foreground">
				{m['AccommodationsFeature.ReservationRulesGuest.timeZone']()}
			</dt>
			<dd class="font-medium wrap-anywhere">{accommodation.timeZone}</dd>
		</div>
	</dl>

	<Alert.Root role="note">
		<ClockIcon />
		<Alert.Title>{m['AccommodationsFeature.ReservationRulesGuest.arrivalToday']()}</Alert.Title>
		<Alert.Description>
			{accommodation.sameDayReservation
				? m['AccommodationsFeature.ReservationRulesGuest.sameDayOn']({
						time: accommodation.checkInStart
					})
				: m['AccommodationsFeature.ReservationRulesGuest.sameDayOff']()}
		</Alert.Description>
	</Alert.Root>
	<p class="mt-3 text-xs leading-5 text-muted-foreground">
		{m['AccommodationsFeature.ReservationRulesGuest.conditionsHint']()}
	</p>
	{#if accommodation.bookingMode !== 'instant'}
		<div class="mt-5 flex items-start gap-3 text-sm">
			<span
				class="mt-0.5 icon-[lucide--message-square-check] size-4 shrink-0 text-muted-foreground"
				aria-hidden="true"
			></span>
			<div>
				<p class="font-medium">
					{m['AccommodationsFeature.ReservationRulesGuest.approvalTitle']()}
				</p>
				<p class="mt-1 max-w-prose leading-6 text-muted-foreground">
					{m['AccommodationsFeature.ReservationRulesGuest.approval']()}
				</p>
			</div>
		</div>
	{/if}
</section>
