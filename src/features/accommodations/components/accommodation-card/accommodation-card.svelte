<script lang="ts">
	// SVELTEKIT IMPORTS
	import { page } from '$app/state';

	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// COMPONENTS
	import { Badge } from '@/components/ui/badge/index.js';
	import AccommodationCardRating from './accommodation-card-rating.svelte';
	import FavoriteButton from '@/features/favorites/components/favorite-button/favorite-button.svelte';
	import ImageGallerySmall from '@/components/ui/custom-components/image-gallery/image-gallery-small.svelte';
	import Link from '@/components/ui/custom-components/link/link.svelte';
	import Plural from '@/components/ui/custom-components/plural/plural.svelte';
	import AccommodationPrice from '@/features/accommodations/components/accommodation-price/accommodation-price.svelte';

	// TYPES
	import type { AccommodationCard } from '@/shared/features/accommodations/types/accommodationTypes.js';
	import type { Snippet } from 'svelte';

	let {
		accommodation,
		onhover,
		onfocuschange,
		close
	}: {
		accommodation: AccommodationCard;
		onhover?: (hovered: boolean) => void;
		onfocuschange?: (focused: boolean) => void;
		close?: Snippet;
	} = $props();
</script>

<article
	class="group relative flex h-full min-w-0 flex-col gap-3"
	onpointerenter={() => onhover?.(true)}
	onpointerleave={() => onhover?.(false)}
	onfocusin={() => onfocuschange?.(true)}
	onfocusout={(event) => {
		const nextTarget = event.relatedTarget;
		if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
			onfocuschange?.(false);
		}
	}}
>
	<ImageGallerySmall images={accommodation.imageUrls} alt={accommodation.name} />

	<div class="absolute top-3 right-3 z-10 flex items-center gap-2">
		<FavoriteButton accommodationId={accommodation._id} name={accommodation.name} />
		{@render close?.()}
	</div>

	<div class="flex flex-1 flex-col gap-2 px-1">
		<p class="text-xs text-muted-foreground capitalize">
			{accommodation.type} &middot; {accommodation.address.city}
		</p>

		<div class="flex items-start justify-between gap-3">
			<h2 class="min-w-0 flex-1 text-base leading-snug font-semibold wrap-break-word">
				<Link
					class="rounded-sm underline-offset-4 after:absolute after:inset-0 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4"
					href={UNPROTECTED_PAGE_ENDPOINTS.ACCOMMODATION(accommodation._id) + page.url.search}
					target="_blank"
					rel="noopener noreferrer"
				>
					{accommodation.name}
				</Link>
			</h2>
			<div class="shrink-0 pt-0.5 whitespace-nowrap">
				<AccommodationCardRating reviews={accommodation.reviews} />
			</div>
		</div>

		<p class="flex flex-wrap items-center gap-x-1 text-xs text-muted-foreground">
			<Plural
				count={accommodation.maxGuests}
				forms={{
					one: m['AccommodationsFeature.AccommodationCard.guest'](),
					other: m['AccommodationsFeature.AccommodationCard.guests']()
				}}
			/>

			<span aria-hidden="true">&middot;</span>

			<Plural
				count={accommodation.bedrooms}
				forms={{
					one: m['AccommodationsFeature.AccommodationCard.bedroom'](),
					other: m['AccommodationsFeature.AccommodationCard.bedrooms']()
				}}
			/>

			<span aria-hidden="true">&middot;</span>

			<Plural
				count={accommodation.beds}
				forms={{
					one: m['AccommodationsFeature.AccommodationCard.bed'](),
					other: m['AccommodationsFeature.AccommodationCard.beds']()
				}}
			/>

			<span aria-hidden="true">&middot;</span>

			<Plural
				count={accommodation.bathrooms}
				forms={{
					one: m['AccommodationsFeature.AccommodationCard.bathroom'](),
					other: m['AccommodationsFeature.AccommodationCard.bathrooms']()
				}}
			/>
		</p>

		<div class="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pt-2">
			<p class="text-base font-semibold tabular-nums">
				<AccommodationPrice pricing={accommodation} />
				<span class="text-sm font-normal">
					{m['AccommodationsFeature.AccommodationCard.night']()}
				</span>
			</p>

			{#if accommodation.bookingMode === 'instant'}
				<Badge variant="default">
					<span class="icon-[lucide--zap] size-3.5" aria-hidden="true"></span>
					{m['AccommodationsFeature.BookingMode.instant']()}
				</Badge>
			{/if}
		</div>
	</div>
</article>
