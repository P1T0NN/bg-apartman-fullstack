<script lang="ts">
	// SVELTEKIT IMPORTS
	import { page } from '$app/state';
	import { getLocale } from '@/lib/paraglide/runtime.js';

	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// COMPONENTS
	import Link from '@/components/ui/custom-components/link/link.svelte';
	import ShareValue from '@/components/ui/custom-components/share-value/share-value.svelte';

	// UTILS
	import { formatRatingAverage } from '@/shared/features/reviews/utils/formatRatingAverage.js';

	// TYPES
	import type { PublicAccommodation } from '@/shared/features/accommodations/types/accommodationTypes.js';

	// LUCIDE ICONS
	// Lucide is imported directly instead of iconify because filled stars use `fill-current`,
	// and iconify/tailwind icons render via a CSS mask that cannot be filled.
	import Star from '@lucide/svelte/icons/star';

	let { accommodation }: { accommodation: PublicAccommodation } = $props();
</script>

<header class="flex flex-col gap-2 pb-6">
	<div class="flex items-center justify-between gap-4">
		<Link
			href={UNPROTECTED_PAGE_ENDPOINTS.SEARCH + page.url.search}
			class="flex min-h-11 w-fit items-center gap-2 rounded-sm text-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4"
		>
			<span class="icon-[lucide--arrow-left] size-4" aria-hidden="true"></span>
			{m['AccommodationPage.AccommodationHeader.back']()}
		</Link>

		<ShareValue
			label={m['AccommodationPage.AccommodationHeader.share']()}
			value={page.url.origin + page.url.pathname}
		/>
	</div>

	<div class="min-w-0">
		<p class="mb-3 w-fit rounded-md bg-muted px-2.5 py-1 text-xs font-medium">
			{m[`AccommodationPage.AccommodationHeader.${accommodation.spaceType}`]()}
		</p>

		<h1 class="max-w-4xl text-3xl font-semibold tracking-tight wrap-break-word sm:text-4xl">
			{accommodation.name}
		</h1>

		<div class="mt-2 flex flex-wrap items-center gap-x-6">
			{#if accommodation.reviews.count}
				<a
					href="#reviews"
					class="flex min-h-11 items-center gap-2 rounded-sm text-sm font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
				>
					<Star class="size-4 fill-current text-primary" aria-hidden="true" />
					{m['AccommodationPage.AccommodationHeader.reviewSummary']({
						average: formatRatingAverage(accommodation.reviews.average ?? 0, getLocale()),
						count: accommodation.reviews.count
					})}
				</a>
			{:else}
				<a
					href="#reviews"
					class="flex min-h-11 items-center rounded-sm text-sm text-muted-foreground underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
				>
					{m['ReviewsFeature.Reviews.noReviews']()}
				</a>
			{/if}

			<a
				href="#location"
				class="flex min-h-11 items-center gap-2 rounded-sm text-sm underline decoration-border underline-offset-4 hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2"
			>
				<span class="icon-[lucide--map-pin] size-4 shrink-0" aria-hidden="true"></span>
				{accommodation.address.city}, {accommodation.address.country}
			</a>
		</div>
	</div>
</header>
