<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime.js';

	// COMPONENTS
	import { Badge } from '@/components/ui/badge/index.js';
	import { Button } from '@/components/ui/button/index.js';

	import MyReviewDetailsDialog from '@/components/pages/(protected)/guest/my-reviews/my-review-details-dialog/my-review-details-dialog.svelte';

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

<MyReviewDetailsDialog reviewId={review._id} {review}>
	{#snippet trigger({ id })}
		<article
			class="relative flex flex-col gap-4 border-b py-6 sm:flex-row sm:items-start sm:justify-between sm:gap-8"
		>
			<div class="flex min-w-0 flex-col gap-3">
				<div class="flex flex-wrap items-center gap-2">
					<h2 class="text-lg font-semibold wrap-anywhere">
						{review.accommodationName ?? m['MyReviewsPage.MyReviewItem.unavailable']()}
					</h2>

					<Badge variant={review.status === 'hidden' ? 'outline' : 'secondary'}>
						{review.status === 'hidden'
							? m['MyReviewsPage.MyReviewItem.hidden']()
							: m['MyReviewsPage.MyReviewItem.published']()}
					</Badge>
				</div>

				<div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
					<span
						role="img"
						class="font-medium"
						aria-label={m['MyReviewsPage.MyReviewItem.rating']({ rating: review.rating })}
					>
						<span class="flex items-center gap-0.5" aria-hidden="true">
							{#each [1, 2, 3, 4, 5] as star (star)}
								<Star
									class={star <= review.rating ? 'size-4 fill-current text-primary' : 'size-4'}
								/>
							{/each}
						</span>
					</span>

					<time
						datetime={new Date(review._creationTime).toISOString()}
						class="text-muted-foreground"
					>
						{m['MyReviewsPage.MyReviewItem.submitted']({
							date: formatDate(review._creationTime, getLocale())
						})}
					</time>
				</div>

				<p class="max-w-[70ch] text-sm leading-6 wrap-anywhere whitespace-pre-line">
					{review.comment.length > 240 ? `${review.comment.slice(0, 240)}...` : review.comment}
				</p>
			</div>

			<Button
				commandfor={id}
				command="show-modal"
				class="min-h-11 w-full after:absolute after:inset-0 after:content-[''] sm:w-auto"
			>
				{m['MyReviewsPage.MyReviewItem.view']()}
				<span class="icon-[lucide--arrow-right]" aria-hidden="true" data-icon="inline-end"></span>
			</Button>
		</article>
	{/snippet}
</MyReviewDetailsDialog>
