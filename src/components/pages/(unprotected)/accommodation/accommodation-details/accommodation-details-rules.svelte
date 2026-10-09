<script lang="ts">
	// COMPONENTS
	import AccommodationReservationRulesGuest from '@/features/accommodations/components/accommodation-reservation-rules-guest/accommodation-reservation-rules-guest.svelte';

	// UTILS
	import { m } from '@/lib/paraglide/messages';
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { PublicAccommodation } from '@/shared/features/accommodations/types/accommodationTypes.js';

	let { accommodation }: { accommodation: PublicAccommodation } = $props();

	// Every rule gets a clear yes / no mark so guests don't have to read the wording to understand it.
	const ruleItems = $derived([
		{
			allowed: accommodation.petsAllowed,
			label: accommodation.petsAllowed
				? m['AccommodationPage.AccommodationDetailsRules.petsAllowed']()
				: m['AccommodationPage.AccommodationDetailsRules.noPets']()
		},
		{
			allowed: accommodation.smokingAllowed,
			label: accommodation.smokingAllowed
				? m['AccommodationPage.AccommodationDetailsRules.smokingAllowed']()
				: m['AccommodationPage.AccommodationDetailsRules.noSmoking']()
		},
		{
			allowed: accommodation.partiesAllowed,
			label: accommodation.partiesAllowed
				? m['AccommodationPage.AccommodationDetailsRules.partiesAllowed']()
				: m['AccommodationPage.AccommodationDetailsRules.noParties']()
		}
	]);
</script>

<section id="rules" class="scroll-mt-32 py-9" aria-labelledby="rules-title">
	<h2 id="rules-title" class="mb-6 text-2xl font-semibold tracking-tight">
		{m['AccommodationPage.AccommodationDetailsRules.rules']()}
	</h2>

	<div class="rounded-xl border p-5">
		<h3 class="flex items-center gap-3 font-semibold">
			<span class="icon-[lucide--house] size-5 shrink-0" aria-hidden="true"></span>
			{m['AccommodationPage.AccommodationDetailsRules.houseRules']()}
		</h3>

		<ul class="mt-4 flex flex-col gap-3 text-sm">
			{#each ruleItems as rule (rule.label)}
				<li class="flex items-center gap-3">
					<span
						class={cn(
							'size-5 shrink-0',
							rule.allowed ? 'icon-[lucide--check]' : 'icon-[lucide--x] text-muted-foreground'
						)}
						aria-hidden="true"
					></span>
					{rule.label}
				</li>
			{/each}
		</ul>

		{#if accommodation.houseRules}
			<p class="mt-4 border-t pt-4 text-sm leading-6 whitespace-pre-line">
				{accommodation.houseRules}
			</p>
		{/if}
	</div>

	<div class="mt-4"><AccommodationReservationRulesGuest {accommodation} /></div>
</section>
