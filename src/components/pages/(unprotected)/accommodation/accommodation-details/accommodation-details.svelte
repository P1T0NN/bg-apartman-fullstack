<script lang="ts">
	// SVELTEKIT IMPORTS
	import { page } from '$app/state';

	// COMPONENTS
	import AccommodationDetailsOverview from './accommodation-details-overview.svelte';
	import AccommodationDetailsAmenities from './accommodation-details-amenities.svelte';
	import AccommodationDetailsLocation from './accommodation-details-location.svelte';
	import AccommodationDetailsRules from './accommodation-details-rules.svelte';
	import AccommodationReviews from '../accommodation-reviews/accommodation-reviews.svelte';
	import AccommodationReviewBookings from '../accommodation-reviews/accommodation-review-bookings.svelte';
	import Reviews from '@/features/reviews/components/reviews/reviews.svelte';

	// TYPES
	import type { PublicAccommodation } from '@/shared/features/accommodations/types/accommodationTypes.js';

	let { accommodation }: { accommodation: PublicAccommodation } = $props();
</script>

<div class="min-w-0 divide-y divide-border wrap-anywhere">
	<AccommodationDetailsOverview {accommodation} />
	<AccommodationDetailsAmenities {accommodation} />

	<Reviews reviewSummary={accommodation.reviews}>
		{#snippet reviews({ rating, expanded })}
			<AccommodationReviews accommodationId={accommodation._id} {rating} {expanded} />
		{/snippet}

		{#snippet bookings()}
			{#if page.data.authState.isAuthenticated}
				<AccommodationReviewBookings
					accommodationName={accommodation.name}
					accommodationId={accommodation._id}
				/>
			{/if}
		{/snippet}
	</Reviews>

	<AccommodationDetailsLocation {accommodation} />
	<AccommodationDetailsRules {accommodation} />
</div>
