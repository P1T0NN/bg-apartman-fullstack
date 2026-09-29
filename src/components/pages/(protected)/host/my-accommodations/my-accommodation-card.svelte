<script lang="ts">
	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import * as Card from '@/components/ui/card/index.js';
	import Price from '@/components/ui/custom-components/price/price.svelte';
	import { m } from '@/lib/paraglide/messages';

	// CONFIG
	import { PROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// TYPES
	import type { AccommodationListItem } from '@/shared/features/accommodations/types/accommodationTypes.js';

	let { accommodation }: { accommodation: AccommodationListItem } = $props();

	const coverUrl = $derived(accommodation.imageUrls[0]);

	const location = $derived(
		[accommodation.address.city, accommodation.address.country].filter(Boolean).join(', ')
	);
</script>

<Card.Root
	class="h-full min-w-0 rounded-2xl border border-border pt-0 shadow-none ring-0 [--card-spacing:--spacing(5)]"
>
	<div class="relative aspect-3/2 shrink-0 overflow-hidden bg-muted">
		{#if coverUrl}
			<img
				src={coverUrl}
				alt=""
				loading="lazy"
				decoding="async"
				class="absolute inset-0 size-full object-cover"
			/>
		{:else}
			<div class="flex size-full items-center justify-center">
				<span class="icon-[lucide--image-off] size-6 text-muted-foreground" aria-hidden="true"
				></span>
			</div>
		{/if}
	</div>

	<Card.Content class="flex flex-1 flex-col gap-4">
		<div class="flex flex-col gap-1">
			<p class="text-xs font-medium text-muted-foreground capitalize">{accommodation.type}</p>
			<Card.Title class="text-lg leading-snug font-semibold tracking-tight">
				<h2 class="line-clamp-2 wrap-anywhere" title={accommodation.name}>{accommodation.name}</h2>
			</Card.Title>
			<Card.Description class="text-sm wrap-anywhere">{location}</Card.Description>
		</div>

		<dl class="grid grid-cols-2 gap-x-5 gap-y-2 text-sm">
			<div class="flex items-baseline justify-between gap-2">
				<dt class="text-muted-foreground">
					{m['MyAccommodationsPage.MyAccommodationCard.guests']()}
				</dt>
				<dd class="font-medium tabular-nums">{accommodation.maxGuests}</dd>
			</div>
			<div class="flex items-baseline justify-between gap-2">
				<dt class="text-muted-foreground">
					{m['MyAccommodationsPage.MyAccommodationCard.bedrooms']()}
				</dt>
				<dd class="font-medium tabular-nums">{accommodation.bedrooms}</dd>
			</div>
			<div class="flex items-baseline justify-between gap-2">
				<dt class="text-muted-foreground">
					{m['MyAccommodationsPage.MyAccommodationCard.beds']()}
				</dt>
				<dd class="font-medium tabular-nums">{accommodation.beds}</dd>
			</div>
			<div class="flex items-baseline justify-between gap-2">
				<dt class="text-muted-foreground">
					{m['MyAccommodationsPage.MyAccommodationCard.bathrooms']()}
				</dt>
				<dd class="font-medium tabular-nums">{accommodation.bathrooms}</dd>
			</div>
		</dl>

		<div
			class="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"
		>
			<p class="flex flex-wrap items-baseline gap-x-1.5 text-lg font-semibold tabular-nums">
				<Price value={accommodation.pricePerNightMinor} />
				<span class="text-sm font-normal text-muted-foreground">
					{m['MyAccommodationsPage.MyAccommodationCard.perNight']()}
				</span>
			</p>
			<Button href={PROTECTED_PAGE_ENDPOINTS.MY_ACCOMMODATION(accommodation._id)} variant="outline">
				<span class="icon-[lucide--settings-2] size-4" aria-hidden="true"></span>
				{m['MyAccommodationsPage.MyAccommodationCard.manage']()}
			</Button>
		</div>
	</Card.Content>
</Card.Root>
