<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime.js';

	// COMPONENTS
	import { Badge } from '@/components/ui/badge/index.js';

	// UTILS
	import { formatDate, formatMonth } from '@/shared/utils/date.js';

	// TYPES
	import type { Review } from '@/shared/features/reviews/types/reviewTypes.js';

	// LUCIDE ICONS
	// Lucide is imported directly instead of iconify because filled stars use `fill-current`,
	// and iconify/tailwind icons render via a CSS mask that cannot be filled.
	import Star from '@lucide/svelte/icons/star';

	let { review }: { review: Review } = $props();

	let expanded = $state(false);

	const isLong = $derived(review.comment.length > 400);
	const month = $derived(formatMonth(Date.parse(`${review.stayMonth}-01`), getLocale()));
</script>

<article id={`review-${review._id}`} class="scroll-mt-24 py-6">
	<div class="flex flex-wrap items-start justify-between gap-3">
		<div class="flex flex-col gap-1.5">
			<div class="flex flex-wrap items-center gap-2">
				<h3 class="font-semibold wrap-anywhere">{review.authorName}</h3>
				<Badge variant="secondary">
					{m['AccommodationPage.AccommodationReviewsItem.verified']()}
				</Badge>
			</div>

			<p class="text-sm text-muted-foreground">
				{m['AccommodationPage.AccommodationReviewsItem.stayed']({ month })}
			</p>
		</div>

		<span
			class="text-sm font-medium"
			aria-label={m['AccommodationPage.AccommodationReviewsItem.rating']({ rating: review.rating })}
		>
			<span class="flex items-center gap-0.5" aria-hidden="true">
				{#each [1, 2, 3, 4, 5] as star (star)}
					<Star class={star <= review.rating ? 'size-4 fill-current' : 'size-4'} />
				{/each}
			</span>
		</span>
	</div>

	<p class="mt-4 max-w-[70ch] text-sm leading-6 wrap-anywhere whitespace-pre-line">
		{isLong && !expanded ? `${review.comment.slice(0, 400)}...` : review.comment}
	</p>

	{#if isLong}
		<button
			type="button"
			class="mt-1 min-h-11 rounded-sm text-sm font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
			aria-expanded={expanded}
			onclick={() => (expanded = !expanded)}
		>
			{expanded
				? m['AccommodationPage.AccommodationReviewsItem.showLess']()
				: m['AccommodationPage.AccommodationReviewsItem.readMore']()}
		</button>
	{/if}

	<p class="mt-3 text-xs text-muted-foreground">
		{m['AccommodationPage.AccommodationReviewsItem.published']({
			date: formatDate(review._creationTime, getLocale())
		})}
	</p>
</article>
