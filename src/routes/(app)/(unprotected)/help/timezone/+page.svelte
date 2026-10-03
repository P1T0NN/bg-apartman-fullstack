<script lang="ts">
	// COMPONENTS
	import HelpContent from '@/components/pages/(unprotected)/help/help-content.svelte';
	import Link from '@/components/ui/custom-components/link/link.svelte';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// UTILS
	import { m } from '@/lib/paraglide/messages';

	const sections = [
		{ id: 'short-version', label: m['HelpTimezonePage.summaryTitle']() },
		{ id: 'why', label: m['HelpTimezonePage.whyTitle']() },
		{ id: 'source', label: m['HelpTimezonePage.sourceTitle']() },
		{ id: 'used-for', label: m['HelpTimezonePage.usedForTitle']() },
		{ id: 'locked', label: m['HelpTimezonePage.lockedTitle']() },
		{ id: 'time', label: m['HelpTimezonePage.timeTitle']() },
		{ id: 'clock-changes', label: m['HelpTimezonePage.dstTitle']() }
	];

	const summaryPoints = [
		m['HelpTimezonePage.summaryOne'](),
		m['HelpTimezonePage.summaryTwo'](),
		m['HelpTimezonePage.summaryThree'](),
		m['HelpTimezonePage.summaryFour']()
	];

	const sourceSteps = [
		{
			icon: 'icon-[lucide--map-pin]',
			title: m['HelpTimezonePage.sourceStepPin'](),
			body: m['HelpTimezonePage.sourceStepPinBody']()
		},
		{
			icon: 'icon-[lucide--globe-2]',
			title: m['HelpTimezonePage.sourceStepDetect'](),
			body: m['HelpTimezonePage.sourceStepDetectBody']()
		},
		{
			icon: 'icon-[lucide--clock]',
			title: m['HelpTimezonePage.sourceStepUse'](),
			body: m['HelpTimezonePage.sourceStepUseBody']()
		}
	];

	const uses = [
		{
			icon: 'icon-[lucide--clock]',
			title: m['HelpTimezonePage.usedForCheckIn'](),
			body: m['HelpTimezonePage.usedForCheckInBody']()
		},
		{
			icon: 'icon-[lucide--calendar-days]',
			title: m['HelpTimezonePage.usedForDates'](),
			body: m['HelpTimezonePage.usedForDatesBody']()
		},
		{
			icon: 'icon-[lucide--calendar-x-2]',
			title: m['HelpTimezonePage.usedForCancellation'](),
			body: m['HelpTimezonePage.usedForCancellationBody']()
		},
		{
			icon: 'icon-[lucide--star]',
			title: m['HelpTimezonePage.usedForReview'](),
			body: m['HelpTimezonePage.usedForReviewBody']()
		}
	];
</script>

<HelpContent
	title={m['HelpTimezonePage.pageTitle']()}
	description={m['HelpTimezonePage.lead']()}
	metaDescription={m['HelpTimezonePage.metaDescription']()}
	{sections}
>
	<section id="short-version" class="rounded-xl border bg-muted/30 p-5 sm:p-6">
		<h2 class="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
			{m['HelpTimezonePage.summaryTitle']()}
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

	<section id="why">
		<h2 class="text-xl font-semibold tracking-tight">{m['HelpTimezonePage.whyTitle']()}</h2>
		<p class="mt-3 text-base leading-7 text-muted-foreground">
			{m['HelpTimezonePage.whyBody1']()}
		</p>
		<p class="mt-3 text-base leading-7 text-muted-foreground">
			{m['HelpTimezonePage.whyBody2']()}
		</p>
	</section>

	<section id="source">
		<h2 class="text-xl font-semibold tracking-tight">{m['HelpTimezonePage.sourceTitle']()}</h2>
		<p class="mt-3 text-base leading-7 text-muted-foreground">
			{m['HelpTimezonePage.sourceIntro']()}
		</p>

		<ol class="mt-6 grid gap-3 sm:grid-cols-3">
			{#each sourceSteps as step (step.title)}
				<li class="flex flex-col gap-3 rounded-xl border bg-card p-4">
					<span class="{step.icon} size-5 text-primary" aria-hidden="true"></span>
					<p class="text-sm font-medium">{step.title}</p>
					<p class="text-xs leading-5 text-muted-foreground">{step.body}</p>
				</li>
			{/each}
		</ol>

		<p class="mt-4 text-sm leading-6 text-muted-foreground">
			{m['HelpTimezonePage.sourceBody1']()}
		</p>
		<p class="mt-3 text-sm leading-6 text-muted-foreground">
			{m['HelpTimezonePage.sourceBody2']()}
		</p>
		<p class="mt-3 text-sm leading-6 text-muted-foreground">
			{m['HelpTimezonePage.sourceBody3']()}
		</p>
	</section>

	<section id="used-for">
		<h2 class="text-xl font-semibold tracking-tight">{m['HelpTimezonePage.usedForTitle']()}</h2>

		<ul class="mt-6 grid gap-4 sm:grid-cols-2">
			{#each uses as entry (entry.title)}
				<li class="flex flex-col gap-3 rounded-xl border bg-card p-5">
					<span class="{entry.icon} size-5 text-primary" aria-hidden="true"></span>
					<p class="text-sm font-medium">{entry.title}</p>
					<p class="text-sm leading-6 text-muted-foreground">{entry.body}</p>
				</li>
			{/each}
		</ul>
	</section>

	<section id="locked">
		<h2 class="text-xl font-semibold tracking-tight">{m['HelpTimezonePage.lockedTitle']()}</h2>
		<p class="mt-3 text-base leading-7 text-muted-foreground">
			{m['HelpTimezonePage.lockedBody1']()}
		</p>
		<p class="mt-3 text-base leading-7 text-muted-foreground">
			{m['HelpTimezonePage.lockedBody2']()}
		</p>
	</section>

	<section id="time">
		<h2 class="text-xl font-semibold tracking-tight">{m['HelpTimezonePage.timeTitle']()}</h2>
		<p class="mt-3 text-base leading-7 text-muted-foreground">
			{m['HelpTimezonePage.timeBody1']()}
		</p>
		<p class="mt-3 text-base leading-7 text-muted-foreground">
			{m['HelpTimezonePage.timeBody2']()}
		</p>

		<div class="mt-6 rounded-xl border bg-card p-5">
			<h3 class="text-sm font-semibold">{m['HelpTimezonePage.timeExampleTitle']()}</h3>

			<div class="mt-4 grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
				<div class="rounded-lg border bg-muted/30 p-4 text-center">
					<span class="mx-auto icon-[lucide--clock] size-5 text-primary" aria-hidden="true"></span>
					<p class="mt-2 text-sm font-medium">{m['HelpTimezonePage.timeExampleProperty']()}</p>
				</div>

				<span
					class="mx-auto icon-[lucide--arrow-right] size-4 rotate-90 text-muted-foreground sm:rotate-0"
					aria-hidden="true"
				></span>

				<div class="rounded-lg border bg-muted/30 p-4 text-center">
					<span
						class="mx-auto icon-[lucide--globe-2] size-5 text-primary"
						aria-hidden="true"
					></span>
					<p class="mt-2 text-sm font-medium">{m['HelpTimezonePage.timeExampleGuest']()}</p>
				</div>
			</div>

			<p class="mt-4 text-sm leading-6 text-muted-foreground">
				{m['HelpTimezonePage.timeExampleBody']()}
			</p>
		</div>
	</section>

	<section id="clock-changes">
		<h2 class="text-xl font-semibold tracking-tight">{m['HelpTimezonePage.dstTitle']()}</h2>
		<p class="mt-3 text-base leading-7 text-muted-foreground">
			{m['HelpTimezonePage.dstBody1']()}
		</p>
		<p class="mt-3 text-base leading-7 text-muted-foreground">
			{m['HelpTimezonePage.dstBody2']()}
		</p>

		<ul class="mt-6 grid gap-4 sm:grid-cols-2">
			<li
				class="flex flex-col gap-3 rounded-xl border border-t-4 border-t-warning/50 bg-warning/5 p-5"
			>
				<span class="icon-[lucide--sun] size-5 text-warning" aria-hidden="true"></span>
				<p class="text-sm font-medium">{m['HelpTimezonePage.dstSpringTitle']()}</p>
				<p class="text-sm leading-6 text-muted-foreground">
					{m['HelpTimezonePage.dstSpringBody']()}
				</p>
			</li>

			<li
				class="flex flex-col gap-3 rounded-xl border border-t-4 border-t-primary/40 bg-primary/5 p-5"
			>
				<span class="icon-[lucide--moon] size-5 text-primary" aria-hidden="true"></span>
				<p class="text-sm font-medium">{m['HelpTimezonePage.dstFallTitle']()}</p>
				<p class="text-sm leading-6 text-muted-foreground">
					{m['HelpTimezonePage.dstFallBody']()}
				</p>
			</li>
		</ul>
	</section>

	<div class="mt-12 rounded-xl border bg-muted/30 p-5 sm:p-6">
		<h2 class="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
			{m['HelpTimezonePage.relatedTitle']()}
		</h2>

		<ul class="mt-3 flex flex-col gap-2 text-sm">
			<li>
				<Link
					href={UNPROTECTED_PAGE_ENDPOINTS.HELP_BOOKING}
					class="font-medium text-primary underline-offset-4 hover:underline"
				>
					{m['HelpTimezonePage.relatedBooking']()}
				</Link>
			</li>
			<li>
				<Link
					href={UNPROTECTED_PAGE_ENDPOINTS.HELP_CANCELLATION_POLICY}
					class="font-medium text-primary underline-offset-4 hover:underline"
				>
					{m['HelpTimezonePage.relatedCancellation']()}
				</Link>
			</li>
		</ul>
	</div>

	<p class="mt-10 text-sm leading-6 text-muted-foreground">
		{m['HelpTimezonePage.questions']()}
		<Link
			href={UNPROTECTED_PAGE_ENDPOINTS.CONTACT}
			class="font-medium text-primary underline-offset-4 hover:underline"
		>
			{m['HelpTimezonePage.contactSupport']()}
		</Link>
	</p>
</HelpContent>
