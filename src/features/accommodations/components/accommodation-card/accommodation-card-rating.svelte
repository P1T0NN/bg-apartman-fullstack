<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime.js';

	// CONFIG
	import { REVIEWS_CONFIG } from '@/shared/features/reviews/config.js';

	// UTILS
	import { formatRatingAverage } from '@/shared/features/reviews/utils/formatRatingAverage.js';

	// TYPES
	import type { ReviewSummary } from '@/shared/features/reviews/types/reviewTypes.js';

	// LUCIDE ICONS
	// Lucide is imported directly instead of iconify because filled stars use `fill-current`,
	// and iconify/tailwind icons render via a CSS mask that cannot be filled.
	import Star from '@lucide/svelte/icons/star';

	let { reviews }: { reviews?: ReviewSummary } = $props();

	const ratingSummary = $derived(
		reviews && reviews.count >= REVIEWS_CONFIG.MIN_RATING_REVIEWS ? reviews : undefined
	);
</script>

{#if ratingSummary}
	<p class="flex items-center gap-1 text-xs font-medium">
		<Star class="size-3.5 fill-current" aria-hidden="true" />
		{m['AccommodationsFeature.AccommodationCardRating.reviewSummary']({
			average: formatRatingAverage(ratingSummary.average ?? 0, getLocale()),
			count: ratingSummary.count
		})}
	</p>
{/if}
