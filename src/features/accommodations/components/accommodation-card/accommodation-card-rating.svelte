<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime.js';

	// COMPONENTS
	import NativeTooltip from '@/components/ui/native-components/native-tooltip/native-tooltip.svelte';

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
	const id = $props.id();

	const ratingSummary = $derived(
		reviews && reviews.count >= REVIEWS_CONFIG.MIN_RATING_REVIEWS ? reviews : undefined
	);
</script>

{#if ratingSummary}
	{@const average = formatRatingAverage(ratingSummary.average ?? 0, getLocale())}
	{@const reviewCount = m['AccommodationsFeature.AccommodationCardRating.reviewCount']({
		count: ratingSummary.count
	})}
	<div class="flex items-center gap-1 text-sm font-medium">
		<Star class="size-3.5 fill-current" aria-hidden="true" />
		<span class="sr-only">
			{m['AccommodationsFeature.AccommodationCardRating.ratingLabel']({ average })}
		</span>
		<span aria-hidden="true">
			{m['AccommodationsFeature.AccommodationCardRating.ratingScore']({ average })}
		</span>
		<div class="relative z-10 inline-flex font-normal text-muted-foreground">
			<NativeTooltip {id} triggerLabel={reviewCount}>
				{#snippet trigger()}
					<span>({ratingSummary.count})</span>
				{/snippet}
				{reviewCount}
			</NativeTooltip>
		</div>
	</div>
{/if}
