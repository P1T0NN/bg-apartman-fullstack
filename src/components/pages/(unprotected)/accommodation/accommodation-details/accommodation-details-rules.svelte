<script lang="ts">
	// UTILS
	import { m } from '@/lib/paraglide/messages';

	// TYPES
	import type { PublicAccommodation } from '@/shared/features/accommodations/types/accommodationTypes.js';

	let { accommodation }: { accommodation: PublicAccommodation } = $props();
</script>

<section id="rules" class="scroll-mt-24 py-9" aria-labelledby="rules-title">
	<h2 id="rules-title" class="mb-6 text-2xl font-semibold tracking-tight">
		{m['AccommodationPage.AccommodationDetailsRules.rules']()}
	</h2>
	<div class="grid gap-8 sm:grid-cols-2">
		<div>
			<h3 class="mb-4 font-semibold">
				{m['AccommodationPage.AccommodationDetailsRules.arrival']()}
			</h3>
			<dl class="flex flex-col gap-4 text-sm">
				<div class="flex flex-wrap justify-between gap-2">
					<dt class="text-muted-foreground">
						{m['AccommodationPage.AccommodationDetailsRules.checkIn']()}
					</dt>
					<dd>{accommodation.checkInStart} &ndash; {accommodation.checkInEnd}</dd>
				</div>
				<div class="flex flex-wrap justify-between gap-2">
					<dt class="text-muted-foreground">
						{m['AccommodationPage.AccommodationDetailsRules.checkOut']()}
					</dt>
					<dd>{accommodation.checkOut}</dd>
				</div>
			</dl>
			<p class="mt-3 text-xs text-muted-foreground">
				{m['AccommodationPage.AccommodationDetailsRules.localTime']()}
			</p>
		</div>
		<div>
			<h3 class="mb-4 font-semibold">
				{m['AccommodationPage.AccommodationDetailsRules.houseRules']()}
			</h3>
			<ul class="flex flex-col gap-3 text-sm">
				<li>
					{accommodation.petsAllowed
						? m['AccommodationPage.AccommodationDetailsRules.petsAllowed']()
						: m['AccommodationPage.AccommodationDetailsRules.noPets']()}
				</li>
				<li>
					{accommodation.smokingAllowed
						? m['AccommodationPage.AccommodationDetailsRules.smokingAllowed']()
						: m['AccommodationPage.AccommodationDetailsRules.noSmoking']()}
				</li>
				<li>
					{accommodation.partiesAllowed
						? m['AccommodationPage.AccommodationDetailsRules.partiesAllowed']()
						: m['AccommodationPage.AccommodationDetailsRules.noParties']()}
				</li>
			</ul>
		</div>
	</div>
	{#if accommodation.houseRules}
		<p class="mt-6 max-w-prose text-sm leading-6 whitespace-pre-line">
			{accommodation.houseRules}
		</p>
	{/if}
	<div class="mt-8">
		<h3 class="font-semibold">{m['AccommodationPage.AccommodationDetailsRules.cancellation']()}</h3>
		<p class="mt-2 max-w-prose text-sm leading-6 text-muted-foreground">
			{m['AccommodationPage.AccommodationDetailsRules.cancellationHint']()}
		</p>
	</div>
</section>
