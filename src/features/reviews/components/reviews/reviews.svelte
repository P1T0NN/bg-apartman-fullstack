<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime.js';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import ReviewsLoading from './loading/reviews-loading.svelte';

	// HOOKS
	import { useObserver } from '@/hooks/useObserver.svelte.js';

	// CONFIG
	import { PAGINATION_CONFIG } from '@/shared/features/pagination/config.js';
	import { REVIEWS_CONFIG } from '@/shared/features/reviews/config.js';

	// UTILS
	import { formatRatingAverage } from '@/shared/features/reviews/utils/formatRatingAverage.js';

	// TYPES
	import type { ReviewSummary } from '@/shared/features/reviews/types/reviewTypes.js';
	import type { Snippet } from 'svelte';

	// LUCIDE ICONS
	// Lucide is imported directly instead of iconify because filled stars use `fill-current`,
	// and iconify/tailwind icons render via a CSS mask that cannot be filled.
	import Star from '@lucide/svelte/icons/star';

	let {
		reviews,
		reviewSummary,
		bookings
	}: {
		reviews: Snippet<[{ rating?: number; expanded: boolean }]>;
		reviewSummary: ReviewSummary;
		bookings?: Snippet;
	} = $props();

	const observer = useObserver({ rootMargin: '300px' });
	let expanded = $state(false);
	let rating = $state<number>();

	const average = $derived(
		reviewSummary.average === null ? '' : formatRatingAverage(reviewSummary.average, getLocale())
	);

	function filter(value?: number) {
		rating = value;
		expanded = true;
	}
</script>

<section
	id="reviews"
	class="scroll-mt-24 py-8 lg:py-10"
	aria-labelledby="reviews-title"
	{@attach observer.observe}
>
	<div class="flex flex-col gap-6">
		<div class="flex flex-col gap-2">
			<h2 id="reviews-title" class="text-xl font-semibold tracking-tight">
				{m['ReviewsFeature.Reviews.title']()}
			</h2>

			{#if reviewSummary.count}
				<p class="text-sm">
					<span class="font-semibold">{m['ReviewsFeature.Reviews.average']({ average })}</span>
					&middot; {m['ReviewsFeature.Reviews.count']({ count: reviewSummary.count })}
				</p>
			{:else}
				<p class="text-sm text-muted-foreground">
					{m['ReviewsFeature.Reviews.noReviews']()}
				</p>
			{/if}
		</div>

		{#if observer.visible}
			{@render bookings?.()}
		{/if}

		{#if reviewSummary.count > 5}
			<div
				class="flex max-w-md flex-col gap-1"
				aria-label={m['ReviewsFeature.Reviews.distribution']()}
			>
				{#each REVIEWS_CONFIG.REVIEW_RATINGS as star, index (star)}
					<button
						type="button"
						class="flex min-h-11 items-center gap-3 rounded-md px-2 text-sm hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 aria-pressed:bg-accent"
						aria-pressed={rating === star}
						aria-label={m['ReviewsFeature.Reviews.filterRating']({
							rating: star,
							count: reviewSummary.distribution[index]
						})}
						onclick={() => filter(star)}
					>
						<span class="flex w-8 shrink-0 items-center gap-1" aria-hidden="true">
							{star}<Star class="size-3.5 fill-current" />
						</span>
						<span class="h-2 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
							<span
								class="block h-full rounded-full bg-primary"
								style:width={`${(100 * reviewSummary.distribution[index]) / reviewSummary.count}%`}
							></span>
						</span>
						<span class="w-10 text-end tabular-nums">{reviewSummary.distribution[index]}</span>
					</button>
				{/each}
			</div>
		{/if}

		{#if rating !== undefined}
			<div class="flex flex-wrap items-center gap-3" role="status">
				<p class="text-sm">{m['ReviewsFeature.Reviews.filtered']({ rating })}</p>

				<Button variant="outline" size="sm" onclick={() => filter()}>
					{m['ReviewsFeature.Reviews.clearFilter']()}
				</Button>
			</div>
		{/if}

		{#if reviewSummary.count}
			{#if observer.visible}
				{#key expanded}
					{@render reviews({ rating, expanded })}
				{/key}

				{#if !expanded && reviewSummary.count > PAGINATION_CONFIG.DEFAULT_PREVIEW_PAGE_SIZE}
					<Button variant="outline" class="min-h-11 w-fit" onclick={() => (expanded = true)}>
						{m['ReviewsFeature.Reviews.showAll']({ count: reviewSummary.count })}
					</Button>
				{/if}
			{:else}
				<ReviewsLoading />
			{/if}
		{:else}
			<p class="text-sm text-muted-foreground">
				{m['ReviewsFeature.Reviews.firstReview']()}
			</p>
		{/if}
	</div>
</section>
