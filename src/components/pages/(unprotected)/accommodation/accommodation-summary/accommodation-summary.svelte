<script lang="ts">
	// SVELTEKIT IMPORTS
	import { page } from '$app/state';

	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// COMPONENTS
	import * as Card from '@/components/ui/card/index.js';
	import { Button } from '@/components/ui/button/index.js';
	import Plural from '@/components/ui/custom-components/plural/plural.svelte';
	import Price from '@/components/ui/custom-components/price/price.svelte';

	// TYPES
	import type { PublicAccommodation } from '@/shared/features/accommodations/types/accommodationTypes.js';

	let { accommodation }: { accommodation: PublicAccommodation } = $props();
</script>

<aside id="stay-price" aria-labelledby="stay-price-title" class="scroll-mt-24">
	<Card.Root class="rounded-2xl shadow-sm">
		<Card.Header>
			<Card.Title
				><h2 id="stay-price-title">
					{m['AccommodationPage.AccommodationSummary.title']()}
				</h2></Card.Title
			>
			<Card.Description>{m['AccommodationPage.AccommodationSummary.listedRate']()}</Card.Description
			>
		</Card.Header>

		<Card.Content>
			<p class="flex flex-wrap items-baseline gap-2">
				<span class="text-3xl font-semibold tracking-tight tabular-nums"
					><Price value={accommodation.pricePerNightMinor} /></span
				><span class="text-sm text-muted-foreground"
					>{m['AccommodationsFeature.AccommodationCard.night']()}</span
				>
			</p>

			<dl class="mt-6 flex flex-col gap-4 border-t pt-5 text-sm">
				<div class="flex justify-between gap-4">
					<dt class="text-muted-foreground">
						{m['AccommodationPage.AccommodationSummary.minimum']()}
					</dt>

					<dd>
						<Plural
							count={accommodation.minimumStay}
							forms={{
								one: m['AccommodationPage.AccommodationSummary.night'](),
								other: m['AccommodationPage.AccommodationSummary.nights']()
							}}
						/>
					</dd>
				</div>

				{#if accommodation.maximumStay}<div class="flex justify-between gap-4">
						<dt class="text-muted-foreground">
							{m['AccommodationPage.AccommodationSummary.maximum']()}
						</dt>

						<dd>
							<Plural
								count={accommodation.maximumStay}
								forms={{
									one: m['AccommodationPage.AccommodationSummary.night'](),
									other: m['AccommodationPage.AccommodationSummary.nights']()
								}}
							/>
						</dd>
					</div>
				{/if}

				<div class="flex justify-between gap-4">
					<dt class="text-muted-foreground">
						{m['AccommodationPage.AccommodationSummary.capacity']()}
					</dt>
					<dd>{accommodation.maxGuests}</dd>
				</div>
			</dl>
		</Card.Content>

		<Card.Footer class="flex-col items-stretch gap-3">
			<Button
				href={UNPROTECTED_PAGE_ENDPOINTS.BOOK_ACCOMMODATION(accommodation._id) + page.url.search}
				class="min-h-11">{m['AccommodationPage.AccommodationSummary.planBooking']()}</Button
			>
			<p class="text-xs leading-5 text-muted-foreground">
				{m['AccommodationPage.AccommodationSummary.priceHint']()}
			</p>
		</Card.Footer>
	</Card.Root>
</aside>
