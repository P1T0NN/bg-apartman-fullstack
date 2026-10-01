<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime.js';

	// COMPONENTS
	import { Badge } from '@/components/ui/badge/index.js';

	// UTILS
	import { formatDate } from '@/shared/utils/date.js';

	// TYPES
	import type { MyReview } from '@/shared/features/reviews/types/reviewTypes.js';

	let { review }: { review: MyReview } = $props();
</script>

<header class="flex flex-col gap-3">
	<div class="flex flex-wrap items-center gap-3">
		<Badge variant={review.status === 'hidden' ? 'outline' : 'secondary'}>
			{review.status === 'hidden'
				? m['MyReviewsPage.MyReviewDetailsDialogHeader.hidden']()
				: m['MyReviewsPage.MyReviewDetailsDialogHeader.published']()}
		</Badge>
	</div>
	<p class="text-lg font-medium wrap-anywhere">
		{review.accommodationName ?? m['MyReviewsPage.MyReviewDetailsDialogHeader.unavailable']()}
	</p>
	{#if review.checkInDate && review.checkOutDate}
		<p class="text-sm text-muted-foreground">
			{m['MyReviewsPage.MyReviewDetailsDialogHeader.stay']({
				checkIn: formatDate(Date.parse(review.checkInDate), getLocale()),
				checkOut: formatDate(Date.parse(review.checkOutDate), getLocale())
			})}
		</p>
	{/if}
</header>
