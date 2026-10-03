<script lang="ts">
	// COMPONENTS
	import HelpContent from '@/components/pages/(unprotected)/help/help-content.svelte';
	import Link from '@/components/ui/custom-components/link/link.svelte';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// UTILS
	import { m } from '@/lib/paraglide/messages';

	const sections = [
		{ id: 'short-version', label: m['HelpReviewsPage.summaryTitle']() },
		{ id: 'eligible', label: m['HelpReviewsPage.eligibleTitle']() },
		{ id: 'how', label: m['HelpReviewsPage.howTitle']() },
		{ id: 'window', label: m['HelpReviewsPage.windowTitle']() },
		{ id: 'public', label: m['HelpReviewsPage.publicTitle']() },
		{ id: 'ratings', label: m['HelpReviewsPage.ratingsTitle']() },
		{ id: 'moderation', label: m['HelpReviewsPage.moderationTitle']() },
		{ id: 'mine', label: m['HelpReviewsPage.mineTitle']() }
	];

	const summaryPoints = [
		m['HelpReviewsPage.summaryOne'](),
		m['HelpReviewsPage.summaryTwo'](),
		m['HelpReviewsPage.summaryThree'](),
		m['HelpReviewsPage.summaryFour']()
	];

	const eligibilityPoints = [
		m['HelpReviewsPage.eligibleCompleted'](),
		m['HelpReviewsPage.eligibleYours'](),
		m['HelpReviewsPage.eligibleWindow'](),
		m['HelpReviewsPage.eligibleNotReviewed']()
	];

	const reviewSteps = [
		{
			title: m['HelpReviewsPage.howStepFind'](),
			body: m['HelpReviewsPage.howStepFindBody']()
		},
		{
			title: m['HelpReviewsPage.howStepRate'](),
			body: m['HelpReviewsPage.howStepRateBody']()
		},
		{
			title: m['HelpReviewsPage.howStepWrite'](),
			body: m['HelpReviewsPage.howStepWriteBody']()
		},
		{
			title: m['HelpReviewsPage.howStepPreview'](),
			body: m['HelpReviewsPage.howStepPreviewBody']()
		}
	];
</script>

<HelpContent
	title={m['HelpReviewsPage.pageTitle']()}
	description={m['HelpReviewsPage.lead']()}
	metaDescription={m['HelpReviewsPage.metaDescription']()}
	{sections}
>
	<section id="short-version" class="rounded-xl border bg-muted/30 p-5 sm:p-6">
		<h2 class="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
			{m['HelpReviewsPage.summaryTitle']()}
		</h2>

		<ul class="mt-4 flex flex-col gap-2.5 text-sm leading-6">
			{#each summaryPoints as point (point)}
				<li class="flex items-start gap-2.5">
					<span
						class="mt-1 icon-[lucide--check] size-4 shrink-0 text-primary"
						aria-hidden="true"
					></span>
					<span>{point}</span>
				</li>
			{/each}
		</ul>
	</section>

	<section id="eligible">
		<h2 class="text-xl font-semibold tracking-tight">{m['HelpReviewsPage.eligibleTitle']()}</h2>
		<p class="mt-3 text-base leading-7 text-muted-foreground">
			{m['HelpReviewsPage.eligibleIntro']()}
		</p>

		<ul class="mt-6 flex flex-col gap-3">
			{#each eligibilityPoints as point (point)}
				<li class="flex items-start gap-3 rounded-xl border bg-card p-4 text-sm leading-6">
					<span
						class="mt-1 icon-[lucide--check] size-4 shrink-0 text-success"
						aria-hidden="true"
					></span>
					<span>{point}</span>
				</li>
			{/each}
		</ul>

		<p class="mt-4 flex items-start gap-2.5 text-sm leading-6 text-muted-foreground">
			<span
				class="mt-1 icon-[lucide--info] size-4 shrink-0 text-muted-foreground"
				aria-hidden="true"
			></span>
			<span>{m['HelpReviewsPage.eligibleSelf']()}</span>
		</p>
	</section>

	<section id="how">
		<h2 class="text-xl font-semibold tracking-tight">{m['HelpReviewsPage.howTitle']()}</h2>
		<p class="mt-3 text-base leading-7 text-muted-foreground">
			{m['HelpReviewsPage.howIntro']()}
		</p>

		<ol class="mt-6 flex flex-col gap-3">
			{#each reviewSteps as step, index (step.title)}
				<li class="flex gap-4 rounded-xl border bg-card p-4">
					<span
						class="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
					>
						{index + 1}
					</span>
					<div class="flex min-w-0 flex-col gap-1">
						<p class="text-sm font-medium">{step.title}</p>
						<p class="text-sm leading-6 text-muted-foreground">{step.body}</p>
					</div>
				</li>
			{/each}
		</ol>
	</section>

	<section id="window">
		<h2 class="text-xl font-semibold tracking-tight">{m['HelpReviewsPage.windowTitle']()}</h2>
		<p class="mt-3 text-base leading-7 text-muted-foreground">
			{m['HelpReviewsPage.windowBody1']()}
		</p>
		<p class="mt-3 text-base leading-7 text-muted-foreground">
			{m['HelpReviewsPage.windowBody2']()}
		</p>
	</section>

	<section id="public">
		<h2 class="text-xl font-semibold tracking-tight">{m['HelpReviewsPage.publicTitle']()}</h2>
		<p class="mt-3 text-base leading-7 text-muted-foreground">
			{m['HelpReviewsPage.publicBody1']()}
		</p>
		<p class="mt-3 text-base leading-7 text-muted-foreground">
			{m['HelpReviewsPage.publicBody2']()}
		</p>
	</section>

	<section id="ratings">
		<h2 class="text-xl font-semibold tracking-tight">{m['HelpReviewsPage.ratingsTitle']()}</h2>
		<p class="mt-3 text-base leading-7 text-muted-foreground">
			{m['HelpReviewsPage.ratingsBody1']()}
		</p>
		<p class="mt-3 text-base leading-7 text-muted-foreground">
			{m['HelpReviewsPage.ratingsBody2']()}
		</p>
	</section>

	<section id="moderation" class="rounded-xl border border-primary/25 bg-primary/5 p-5 sm:p-6">
		<div class="flex items-start gap-3">
			<span
				class="mt-0.5 icon-[lucide--shield-check] size-5 shrink-0 text-primary"
				aria-hidden="true"
			></span>
			<div class="min-w-0">
				<h2 class="text-base font-semibold">{m['HelpReviewsPage.moderationTitle']()}</h2>
				<p class="mt-2 text-sm leading-6">{m['HelpReviewsPage.moderationBody']()}</p>
			</div>
		</div>
	</section>

	<section id="mine">
		<h2 class="text-xl font-semibold tracking-tight">{m['HelpReviewsPage.mineTitle']()}</h2>
		<p class="mt-3 text-base leading-7 text-muted-foreground">
			{m['HelpReviewsPage.mineBody']()}
		</p>
	</section>

	<div class="mt-12 rounded-xl border bg-muted/30 p-5 sm:p-6">
		<h2 class="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
			{m['HelpReviewsPage.relatedTitle']()}
		</h2>

		<ul class="mt-3 flex flex-col gap-2 text-sm">
			<li>
				<Link
					href={UNPROTECTED_PAGE_ENDPOINTS.HELP_BOOKING}
					class="font-medium text-primary underline-offset-4 hover:underline"
				>
					{m['HelpReviewsPage.relatedBooking']()}
				</Link>
			</li>
			<li>
				<Link
					href={UNPROTECTED_PAGE_ENDPOINTS.HELP_CLAIM_BOOKING}
					class="font-medium text-primary underline-offset-4 hover:underline"
				>
					{m['HelpReviewsPage.relatedClaim']()}
				</Link>
			</li>
		</ul>
	</div>

	<p class="mt-10 text-sm leading-6 text-muted-foreground">
		{m['HelpReviewsPage.questions']()}
		<Link
			href={UNPROTECTED_PAGE_ENDPOINTS.CONTACT}
			class="font-medium text-primary underline-offset-4 hover:underline"
		>
			{m['HelpReviewsPage.contactSupport']()}
		</Link>
	</p>
</HelpContent>
