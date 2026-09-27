<script lang="ts">
	// UTILS
	import { m } from '@/lib/paraglide/messages';

	// TYPES
	import type { PublicAccommodation } from '@/shared/features/accommodations/types/accommodationTypes.js';

	let { accommodation }: { accommodation: PublicAccommodation } = $props();
</script>

<section id="overview" class="scroll-mt-24 pb-9" aria-labelledby="overview-title">
	<h2 id="overview-title" class="text-2xl font-semibold tracking-tight">
		{m['AccommodationPage.AccommodationDetailsOverview.overview']()}
	</h2>

	<dl class="my-6 grid grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-4">
		<div>
			<dt class="text-sm text-muted-foreground">
				{m['AccommodationsFeature.AccommodationCard.guests']()}
			</dt>
			<dd class="mt-1.5 text-xl font-semibold">{accommodation.maxGuests}</dd>
		</div>

		<div>
			<dt class="text-sm text-muted-foreground">
				{m['AccommodationsFeature.AccommodationCard.bedrooms']()}
			</dt>
			<dd class="mt-1.5 text-xl font-semibold">{accommodation.bedrooms}</dd>
		</div>

		<div>
			<dt class="text-sm text-muted-foreground">
				{m['AccommodationsFeature.AccommodationCard.beds']()}
			</dt>
			<dd class="mt-1.5 text-xl font-semibold">{accommodation.beds}</dd>
		</div>

		<div>
			<dt class="text-sm text-muted-foreground">
				{m['AccommodationsFeature.AccommodationCard.bathrooms']()}
			</dt>
			<dd class="mt-1.5 text-xl font-semibold">{accommodation.bathrooms}</dd>
		</div>
	</dl>

	<p class="max-w-prose text-base leading-7 whitespace-pre-line">{accommodation.description}</p>
</section>
