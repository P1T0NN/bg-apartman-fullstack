<script lang="ts">
	// COMPONENTS
	import HelpContent from '@/components/pages/(unprotected)/help/help-content.svelte';
	import Link from '@/components/ui/custom-components/link/link.svelte';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// UTILS
	import { m } from '@/lib/paraglide/messages';

	const sections = [
		{ id: 'short-version', label: m['HelpFindAndBookPage.summaryTitle']() },
		{ id: 'search', label: m['HelpFindAndBookPage.searchTitle']() },
		{ id: 'filters', label: m['HelpFindAndBookPage.filtersTitle']() },
		{ id: 'listing', label: m['HelpFindAndBookPage.listingTitle']() },
		{ id: 'request', label: m['HelpFindAndBookPage.requestTitle']() },
		{ id: 'after', label: m['HelpFindAndBookPage.afterTitle']() },
		{ id: 'payments', label: m['HelpFindAndBookPage.paymentsTitle']() }
	];

	const summaryPoints = [
		m['HelpFindAndBookPage.summaryOne'](),
		m['HelpFindAndBookPage.summaryTwo'](),
		m['HelpFindAndBookPage.summaryThree'](),
		m['HelpFindAndBookPage.summaryFour']()
	];

	const searchSteps = [
		{
			title: m['HelpFindAndBookPage.searchStepWhere'](),
			body: m['HelpFindAndBookPage.searchStepWhereBody']()
		},
		{
			title: m['HelpFindAndBookPage.searchStepWhen'](),
			body: m['HelpFindAndBookPage.searchStepWhenBody']()
		},
		{
			title: m['HelpFindAndBookPage.searchStepWho'](),
			body: m['HelpFindAndBookPage.searchStepWhoBody']()
		}
	];

	const requestSteps = [
		{
			title: m['HelpFindAndBookPage.requestStepDates'](),
			body: m['HelpFindAndBookPage.requestStepDatesBody']()
		},
		{
			title: m['HelpFindAndBookPage.requestStepDetails'](),
			body: m['HelpFindAndBookPage.requestStepDetailsBody']()
		},
		{
			title: m['HelpFindAndBookPage.requestStepSend'](),
			body: m['HelpFindAndBookPage.requestStepSendBody']()
		}
	];
</script>

<HelpContent
	title={m['HelpFindAndBookPage.pageTitle']()}
	description={m['HelpFindAndBookPage.lead']()}
	metaDescription={m['HelpFindAndBookPage.metaDescription']()}
	{sections}
>
	<section id="short-version" class="rounded-xl border bg-muted/30 p-5 sm:p-6">
		<h2 class="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
			{m['HelpFindAndBookPage.summaryTitle']()}
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

	<section id="search">
		<h2 class="text-xl font-semibold tracking-tight">
			{m['HelpFindAndBookPage.searchTitle']()}
		</h2>
		<p class="mt-3 text-base leading-7 text-muted-foreground">
			{m['HelpFindAndBookPage.searchIntro']()}
		</p>

		<ol class="mt-6 grid gap-3 sm:grid-cols-3">
			{#each searchSteps as step, index (step.title)}
				<li class="flex gap-3 rounded-xl border bg-card p-4">
					<span
						class="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
					>
						{index + 1}
					</span>
					<div class="flex min-w-0 flex-col gap-1">
						<p class="text-sm font-medium">{step.title}</p>
						<p class="text-xs leading-5 text-muted-foreground">{step.body}</p>
					</div>
				</li>
			{/each}
		</ol>

		<p class="mt-4 text-sm leading-6 text-muted-foreground">
			{m['HelpFindAndBookPage.searchResults']()}
		</p>
	</section>

	<section id="filters">
		<h2 class="text-xl font-semibold tracking-tight">
			{m['HelpFindAndBookPage.filtersTitle']()}
		</h2>
		<p class="mt-3 text-base leading-7 text-muted-foreground">
			{m['HelpFindAndBookPage.filtersBody']()}
		</p>
		<p class="mt-3 text-base leading-7 text-muted-foreground">
			{m['HelpFindAndBookPage.sortBody']()}
		</p>
	</section>

	<section id="listing">
		<h2 class="text-xl font-semibold tracking-tight">
			{m['HelpFindAndBookPage.listingTitle']()}
		</h2>
		<p class="mt-3 text-base leading-7 text-muted-foreground">
			{m['HelpFindAndBookPage.listingBody']()}
		</p>
	</section>

	<section id="request">
		<h2 class="text-xl font-semibold tracking-tight">
			{m['HelpFindAndBookPage.requestTitle']()}
		</h2>
		<p class="mt-3 text-base leading-7 text-muted-foreground">
			{m['HelpFindAndBookPage.requestIntro']()}
		</p>

		<ol class="mt-6 flex flex-col gap-3">
			{#each requestSteps as step, index (step.title)}
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

		<p class="mt-4 rounded-xl border border-success/30 bg-success/10 p-4 text-sm leading-6">
			{m['HelpFindAndBookPage.requestNoPayment']()}
		</p>
	</section>

	<section id="after">
		<h2 class="text-xl font-semibold tracking-tight">{m['HelpFindAndBookPage.afterTitle']()}</h2>
		<p class="mt-3 text-base leading-7 text-muted-foreground">
			{m['HelpFindAndBookPage.afterBody1']()}
		</p>
		<p class="mt-3 text-base leading-7 text-muted-foreground">
			{m['HelpFindAndBookPage.afterBody2']()}
		</p>
	</section>

	<section id="payments" class="rounded-xl border border-warning/30 bg-warning/10 p-5 sm:p-6">
		<div class="flex items-start gap-3">
			<span
				class="mt-0.5 icon-[lucide--triangle-alert] size-5 shrink-0 text-warning"
				aria-hidden="true"
			></span>
			<div class="min-w-0">
				<h2 class="text-base font-semibold">{m['HelpFindAndBookPage.paymentsTitle']()}</h2>
				<p class="mt-2 text-sm leading-6">{m['HelpFindAndBookPage.paymentsBody']()}</p>
			</div>
		</div>
	</section>

	<div class="mt-12 rounded-xl border bg-muted/30 p-5 sm:p-6">
		<h2 class="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
			{m['HelpFindAndBookPage.relatedTitle']()}
		</h2>

		<ul class="mt-3 flex flex-col gap-2 text-sm">
			<li>
				<Link
					href={UNPROTECTED_PAGE_ENDPOINTS.HELP_BOOKING}
					class="font-medium text-primary underline-offset-4 hover:underline"
				>
					{m['HelpFindAndBookPage.relatedBooking']()}
				</Link>
			</li>
			<li>
				<Link
					href={UNPROTECTED_PAGE_ENDPOINTS.HELP_CLAIM_BOOKING}
					class="font-medium text-primary underline-offset-4 hover:underline"
				>
					{m['HelpFindAndBookPage.relatedClaim']()}
				</Link>
			</li>
			<li>
				<Link
					href={UNPROTECTED_PAGE_ENDPOINTS.HELP_ACCOUNT}
					class="font-medium text-primary underline-offset-4 hover:underline"
				>
					{m['HelpFindAndBookPage.relatedAccount']()}
				</Link>
			</li>
		</ul>
	</div>

	<p class="mt-10 text-sm leading-6 text-muted-foreground">
		{m['HelpFindAndBookPage.questions']()}
		<Link
			href={UNPROTECTED_PAGE_ENDPOINTS.CONTACT}
			class="font-medium text-primary underline-offset-4 hover:underline"
		>
			{m['HelpFindAndBookPage.contactSupport']()}
		</Link>
	</p>
</HelpContent>
