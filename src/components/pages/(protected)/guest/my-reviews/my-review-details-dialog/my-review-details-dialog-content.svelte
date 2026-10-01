<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime.js';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// UTILS
	import { formatDate } from '@/shared/utils/date.js';

	// TYPES
	import type { MyReview } from '@/shared/features/reviews/types/reviewTypes.js';

	// LUCIDE ICONS
	// Lucide is imported directly instead of iconify because filled stars use `fill-current`,
	// and iconify/tailwind icons render via a CSS mask that cannot be filled.
	import Star from '@lucide/svelte/icons/star';

	let { review }: { review: MyReview } = $props();
</script>

<p class="text-sm leading-6 text-muted-foreground">
	{review.status === 'hidden'
		? m['MyReviewsPage.MyReviewDetailsDialogContent.hiddenNotice']()
		: m['MyReviewsPage.MyReviewDetailsDialogContent.publishedNotice']()}
</p>

<article
	class="flex flex-col gap-4 border-y py-6"
	aria-label={m['MyReviewsPage.MyReviewDetailsDialogContent.contentLabel']()}
>
	<div class="flex flex-wrap items-center justify-between gap-3">
		<h3 class="text-lg font-semibold">
			{m['MyReviewsPage.MyReviewDetailsDialogContent.rating']({ rating: review.rating })}
		</h3>

		<span class="flex items-center gap-0.5 text-xl" aria-hidden="true">
			{#each [1, 2, 3, 4, 5] as star (star)}
				<Star class={star <= review.rating ? 'size-5 fill-current' : 'size-5'} />
			{/each}
		</span>
	</div>

	<p class="max-w-[70ch] text-base leading-7 wrap-anywhere whitespace-pre-line">{review.comment}</p>

	<time
		datetime={new Date(review._creationTime).toISOString()}
		class="text-sm text-muted-foreground"
	>
		{m['MyReviewsPage.MyReviewDetailsDialogContent.submitted']({
			date: formatDate(review._creationTime, getLocale())
		})}
	</time>
</article>

{#if review.accommodationName}
	<Button
		href={`${UNPROTECTED_PAGE_ENDPOINTS.ACCOMMODATION(review.accommodationId)}#reviews`}
		variant="outline"
		class="min-h-11 w-full sm:w-fit"
	>
		{m['MyReviewsPage.MyReviewDetailsDialogContent.viewAccommodation']()}
	</Button>
{/if}
