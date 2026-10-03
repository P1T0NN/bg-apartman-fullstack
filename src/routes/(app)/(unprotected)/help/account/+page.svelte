<script lang="ts">
	// COMPONENTS
	import HelpContent from '@/components/pages/(unprotected)/help/help-content.svelte';
	import Link from '@/components/ui/custom-components/link/link.svelte';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// UTILS
	import { m } from '@/lib/paraglide/messages';

	const sections = [
		{ id: 'short-version', label: m['HelpAccountPage.summaryTitle']() },
		{ id: 'benefits', label: m['HelpAccountPage.benefitsTitle']() },
		{ id: 'create', label: m['HelpAccountPage.createTitle']() },
		{ id: 'settings', label: m['HelpAccountPage.settingsTitle']() },
		{ id: 'together', label: m['HelpAccountPage.togetherTitle']() },
		{ id: 'hosting', label: m['HelpAccountPage.hostingTitle']() }
	];

	const summaryPoints = [
		m['HelpAccountPage.summaryOne'](),
		m['HelpAccountPage.summaryTwo'](),
		m['HelpAccountPage.summaryThree'](),
		m['HelpAccountPage.summaryFour']()
	];

	const benefits = [
		{
			icon: 'icon-[lucide--calendar-check]',
			title: m['HelpAccountPage.benefitBookings'](),
			body: m['HelpAccountPage.benefitBookingsBody']()
		},
		{
			icon: 'icon-[lucide--heart]',
			title: m['HelpAccountPage.benefitSaved'](),
			body: m['HelpAccountPage.benefitSavedBody']()
		},
		{
			icon: 'icon-[lucide--star]',
			title: m['HelpAccountPage.benefitReviews'](),
			body: m['HelpAccountPage.benefitReviewsBody']()
		},
		{
			icon: 'icon-[lucide--link]',
			title: m['HelpAccountPage.benefitClaim'](),
			body: m['HelpAccountPage.benefitClaimBody']()
		},
		{
			icon: 'icon-[lucide--house]',
			title: m['HelpAccountPage.benefitHosting'](),
			body: m['HelpAccountPage.benefitHostingBody']()
		},
		{
			icon: 'icon-[lucide--shield-check]',
			title: m['HelpAccountPage.benefitSecurity'](),
			body: m['HelpAccountPage.benefitSecurityBody']()
		}
	];

	const createSteps = [
		{
			title: m['HelpAccountPage.createStepSignUp'](),
			body: m['HelpAccountPage.createStepSignUpBody']()
		},
		{
			title: m['HelpAccountPage.createStepVerify'](),
			body: m['HelpAccountPage.createStepVerifyBody']()
		},
		{
			title: m['HelpAccountPage.createStepReturn'](),
			body: m['HelpAccountPage.createStepReturnBody']()
		}
	];
</script>

<HelpContent
	title={m['HelpAccountPage.pageTitle']()}
	description={m['HelpAccountPage.lead']()}
	metaDescription={m['HelpAccountPage.metaDescription']()}
	{sections}
>
	<section id="short-version" class="rounded-xl border bg-muted/30 p-5 sm:p-6">
		<h2 class="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
			{m['HelpAccountPage.summaryTitle']()}
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

	<section id="benefits">
		<h2 class="text-xl font-semibold tracking-tight">{m['HelpAccountPage.benefitsTitle']()}</h2>
		<p class="mt-3 text-base leading-7 text-muted-foreground">
			{m['HelpAccountPage.benefitsIntro']()}
		</p>

		<ul class="mt-6 grid gap-4 sm:grid-cols-2">
			{#each benefits as benefit (benefit.title)}
				<li class="flex gap-3 rounded-xl border bg-card p-5">
					<span
						class="{benefit.icon} mt-0.5 size-5 shrink-0 text-primary"
						aria-hidden="true"
					></span>
					<div class="min-w-0">
						<p class="text-sm font-medium">{benefit.title}</p>
						<p class="mt-1 text-sm leading-6 text-muted-foreground">{benefit.body}</p>
					</div>
				</li>
			{/each}
		</ul>
	</section>

	<section id="create">
		<h2 class="text-xl font-semibold tracking-tight">{m['HelpAccountPage.createTitle']()}</h2>
		<p class="mt-3 text-base leading-7 text-muted-foreground">
			{m['HelpAccountPage.createIntro']()}
		</p>

		<ol class="mt-6 flex flex-col gap-3">
			{#each createSteps as step, index (step.title)}
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

	<section id="settings">
		<h2 class="text-xl font-semibold tracking-tight">{m['HelpAccountPage.settingsTitle']()}</h2>
		<p class="mt-3 text-base leading-7 text-muted-foreground">
			{m['HelpAccountPage.settingsIntro']()}
		</p>

		<ul class="mt-6 grid gap-4 sm:grid-cols-3">
			<li class="flex flex-col gap-3 rounded-xl border border-t-4 border-t-primary/40 bg-card p-5">
				<span class="icon-[lucide--user-round] size-5 text-primary" aria-hidden="true"></span>
				<p class="text-sm font-medium">{m['HelpAccountPage.settingsProfileTitle']()}</p>
				<p class="text-xs leading-5 text-muted-foreground">
					{m['HelpAccountPage.settingsProfileBody']()}
				</p>
			</li>

			<li class="flex flex-col gap-3 rounded-xl border border-t-4 border-t-primary/40 bg-card p-5">
				<span class="icon-[lucide--lock] size-5 text-primary" aria-hidden="true"></span>
				<p class="text-sm font-medium">{m['HelpAccountPage.settingsSecurityTitle']()}</p>
				<p class="text-xs leading-5 text-muted-foreground">
					{m['HelpAccountPage.settingsSecurityBody']()}
				</p>
			</li>

			<li
				class="flex flex-col gap-3 rounded-xl border border-t-4 border-t-destructive/50 bg-destructive/5 p-5"
			>
				<span
					class="icon-[lucide--triangle-alert] size-5 text-destructive"
					aria-hidden="true"
				></span>
				<p class="text-sm font-medium">{m['HelpAccountPage.settingsDangerTitle']()}</p>
				<p class="text-xs leading-5 text-muted-foreground">
					{m['HelpAccountPage.settingsDangerBody']()}
				</p>
			</li>
		</ul>
	</section>

	<section id="together">
		<h2 class="text-xl font-semibold tracking-tight">{m['HelpAccountPage.togetherTitle']()}</h2>
		<p class="mt-3 text-base leading-7 text-muted-foreground">
			{m['HelpAccountPage.togetherBody']()}
		</p>
	</section>

	<section id="hosting">
		<h2 class="text-xl font-semibold tracking-tight">{m['HelpAccountPage.hostingTitle']()}</h2>
		<p class="mt-3 text-base leading-7 text-muted-foreground">
			{m['HelpAccountPage.hostingBody']()}
		</p>
	</section>

	<div class="mt-12 rounded-xl border bg-muted/30 p-5 sm:p-6">
		<h2 class="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
			{m['HelpAccountPage.relatedTitle']()}
		</h2>

		<ul class="mt-3 flex flex-col gap-2 text-sm">
			<li>
				<Link
					href={UNPROTECTED_PAGE_ENDPOINTS.HELP_BOOKING}
					class="font-medium text-primary underline-offset-4 hover:underline"
				>
					{m['HelpAccountPage.relatedBooking']()}
				</Link>
			</li>
			<li>
				<Link
					href={UNPROTECTED_PAGE_ENDPOINTS.HELP_CLAIM_BOOKING}
					class="font-medium text-primary underline-offset-4 hover:underline"
				>
					{m['HelpAccountPage.relatedClaim']()}
				</Link>
			</li>
			<li>
				<Link
					href={UNPROTECTED_PAGE_ENDPOINTS.HELP_FOR_HOSTS}
					class="font-medium text-primary underline-offset-4 hover:underline"
				>
					{m['HelpAccountPage.relatedHosts']()}
				</Link>
			</li>
		</ul>
	</div>

	<p class="mt-10 text-sm leading-6 text-muted-foreground">
		{m['HelpAccountPage.questions']()}
		<Link
			href={UNPROTECTED_PAGE_ENDPOINTS.CONTACT}
			class="font-medium text-primary underline-offset-4 hover:underline"
		>
			{m['HelpAccountPage.contactSupport']()}
		</Link>
	</p>
</HelpContent>
