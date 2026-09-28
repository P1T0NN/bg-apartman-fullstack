<script lang="ts">
	// SVELTEKIT IMPORTS
	import { page } from '$app/state';

	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// COMPONENTS
	import FavoriteButton from '@/features/favorites/components/favorite-button/favorite-button.svelte';
	import ImageGallerySmall from '@/components/ui/custom-components/image-gallery/image-gallery-small.svelte';
	import Link from '@/components/ui/custom-components/link/link.svelte';
	import Plural from '@/components/ui/custom-components/plural/plural.svelte';
	import Price from '@/components/ui/custom-components/price/price.svelte';

	// TYPES
	import type { PublicAccommodation } from '@/shared/features/accommodations/types/accommodationTypes.js';
	import type { Snippet } from 'svelte';

	let {
		accommodation,
		onhover,
		close
	}: {
		accommodation: PublicAccommodation;
		onhover?: (hovered: boolean) => void;
		close?: Snippet;
	} = $props();
</script>

<article
	class="group relative flex h-full min-w-0 flex-col gap-3"
	onpointerenter={() => onhover?.(true)}
	onpointerleave={() => onhover?.(false)}
>
	<ImageGallerySmall images={accommodation.imageUrls} alt={accommodation.name} />

	<div class="absolute top-3 right-3 z-10 flex items-center gap-2">
		<FavoriteButton accommodationId={accommodation._id} name={accommodation.name} />
		{@render close?.()}
	</div>

	<div class="flex flex-1 flex-col gap-2 px-1">
		<p class="text-xs text-muted-foreground capitalize">
			{accommodation.type} · {accommodation.address.city}
		</p>

		<h2 class="text-base leading-snug font-semibold">
			<Link
				class="rounded-sm underline-offset-4 after:absolute after:inset-0 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4"
				href={UNPROTECTED_PAGE_ENDPOINTS.ACCOMMODATION(accommodation._id) + page.url.search}
				target="_blank"
				rel="noopener noreferrer"
			>
				{accommodation.name}
			</Link>
		</h2>

		<p class="flex flex-wrap items-center gap-x-1 text-xs text-muted-foreground">
			<Plural
				count={accommodation.maxGuests}
				forms={{
					one: m['AccommodationsFeature.AccommodationCard.guest'](),
					other: m['AccommodationsFeature.AccommodationCard.guests']()
				}}
			/>

			<span aria-hidden="true">·</span>

			<Plural
				count={accommodation.bedrooms}
				forms={{
					one: m['AccommodationsFeature.AccommodationCard.bedroom'](),
					other: m['AccommodationsFeature.AccommodationCard.bedrooms']()
				}}
			/>

			<span aria-hidden="true">·</span>

			<Plural
				count={accommodation.beds}
				forms={{
					one: m['AccommodationsFeature.AccommodationCard.bed'](),
					other: m['AccommodationsFeature.AccommodationCard.beds']()
				}}
			/>

			<span aria-hidden="true">·</span>

			<Plural
				count={accommodation.bathrooms}
				forms={{
					one: m['AccommodationsFeature.AccommodationCard.bathroom'](),
					other: m['AccommodationsFeature.AccommodationCard.bathrooms']()
				}}
			/>
		</p>

		<div class="mt-auto pt-2">
			<p class="text-base font-semibold tabular-nums">
				<Price value={accommodation.pricePerNightMinor} />
				<span class="text-sm font-normal"
					>{m['AccommodationsFeature.AccommodationCard.night']()}</span
				>
			</p>
		</div>
	</div>
</article>
