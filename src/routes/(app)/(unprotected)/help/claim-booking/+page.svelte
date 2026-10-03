<script lang="ts">
	// COMPONENTS
	import HelpContent from '@/components/pages/(unprotected)/help/help-content.svelte';
	import Link from '@/components/ui/custom-components/link/link.svelte';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// UTILS
	import { m } from '@/lib/paraglide/messages';

	const sections = [
		{ id: 'short-version', label: m['HelpClaimBookingPage.summaryTitle']() },
		{ id: 'what', label: m['HelpClaimBookingPage.whatTitle']() },
		{ id: 'compare', label: m['HelpClaimBookingPage.compareTitle']() },
		{ id: 'how', label: m['HelpClaimBookingPage.howTitle']() },
		{ id: 'rules', label: m['HelpClaimBookingPage.rulesTitle']() },
		{ id: 'security', label: m['HelpClaimBookingPage.securityTitle']() },
		{ id: 'troubleshooting', label: m['HelpClaimBookingPage.troubleTitle']() }
	];

	const summaryPoints = [
		m['HelpClaimBookingPage.summaryOne'](),
		m['HelpClaimBookingPage.summaryTwo'](),
		m['HelpClaimBookingPage.summaryThree'](),
		m['HelpClaimBookingPage.summaryFour']()
	];

	const findItems = [
		m['HelpClaimBookingPage.compareFindItem1'](),
		m['HelpClaimBookingPage.compareFindItem2']()
	];

	const claimItems = [
		m['HelpClaimBookingPage.compareClaimItem1'](),
		m['HelpClaimBookingPage.compareClaimItem2']()
	];

	const claimSteps = [
		{
			title: m['HelpClaimBookingPage.howStepFind'](),
			body: m['HelpClaimBookingPage.howStepFindBody']()
		},
		{
			title: m['HelpClaimBookingPage.howStepEmail'](),
			body: m['HelpClaimBookingPage.howStepEmailBody']()
		},
		{
			title: m['HelpClaimBookingPage.howStepLink'](),
			body: m['HelpClaimBookingPage.howStepLinkBody']()
		},
		{
			title: m['HelpClaimBookingPage.howStepAdd'](),
			body: m['HelpClaimBookingPage.howStepAddBody']()
		},
		{
			title: m['HelpClaimBookingPage.howStepConfirm'](),
			body: m['HelpClaimBookingPage.howStepConfirmBody']()
		}
	];

	const rules = [
		{
			icon: 'icon-[lucide--mail-check]',
			title: m['HelpClaimBookingPage.rulesEmailTitle'](),
			body: m['HelpClaimBookingPage.rulesEmailBody']()
		},
		{
			icon: 'icon-[lucide--user-check]',
			title: m['HelpClaimBookingPage.rulesOneAccountTitle'](),
			body: m['HelpClaimBookingPage.rulesOneAccountBody']()
		},
		{
			icon: 'icon-[lucide--refresh-cw]',
			title: m['HelpClaimBookingPage.rulesRepeatTitle'](),
			body: m['HelpClaimBookingPage.rulesRepeatBody']()
		},
		{
			icon: 'icon-[lucide--clock]',
			title: m['HelpClaimBookingPage.rulesLinkTitle'](),
			body: m['HelpClaimBookingPage.rulesLinkBody']()
		}
	];

	const troubleItems = [
		{
			title: m['HelpClaimBookingPage.troubleNoEmailTitle'](),
			body: m['HelpClaimBookingPage.troubleNoEmailBody']()
		},
		{
			title: m['HelpClaimBookingPage.troubleMismatchTitle'](),
			body: m['HelpClaimBookingPage.troubleMismatchBody']()
		},
		{
			title: m['HelpClaimBookingPage.troubleLinkedTitle'](),
			body: m['HelpClaimBookingPage.troubleLinkedBody']()
		},
		{
			title: m['HelpClaimBookingPage.troubleExpiredTitle'](),
			body: m['HelpClaimBookingPage.troubleExpiredBody']()
		}
	];
</script>

<HelpContent
	title={m['HelpClaimBookingPage.pageTitle']()}
	description={m['HelpClaimBookingPage.lead']()}
	metaDescription={m['HelpClaimBookingPage.metaDescription']()}
	{sections}
>
	<section id="short-version" class="rounded-xl border bg-muted/30 p-5 sm:p-6">
		<h2 class="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
			{m['HelpClaimBookingPage.summaryTitle']()}
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

	<section id="what">
		<h2 class="text-xl font-semibold tracking-tight">{m['HelpClaimBookingPage.whatTitle']()}</h2>
		<p class="mt-3 text-base leading-7 text-muted-foreground">
			{m['HelpClaimBookingPage.whatBody1']()}
		</p>
		<p class="mt-3 text-base leading-7 text-muted-foreground">
			{m['HelpClaimBookingPage.whatBody2']()}
		</p>
		<p class="mt-3 text-base leading-7 text-muted-foreground">
			{m['HelpClaimBookingPage.whatBody3']()}
		</p>
	</section>

	<section id="compare">
		<h2 class="text-xl font-semibold tracking-tight">
			{m['HelpClaimBookingPage.compareTitle']()}
		</h2>

		<div class="mt-6 grid gap-4 sm:grid-cols-2">
			<div class="flex flex-col gap-3 rounded-xl border bg-card p-5">
				<span class="icon-[lucide--search] size-5 text-primary" aria-hidden="true"></span>
				<p class="text-sm font-medium">{m['HelpClaimBookingPage.compareFindTitle']()}</p>
				<p class="text-sm leading-6 text-muted-foreground">
					{m['HelpClaimBookingPage.compareFindBody']()}
				</p>
				<ul class="mt-1 flex flex-col gap-2 text-sm">
					{#each findItems as item (item)}
						<li class="flex items-start gap-2">
							<span
								class="mt-1 icon-[lucide--check] size-4 shrink-0 text-success"
								aria-hidden="true"
							></span>
							<span class="text-muted-foreground">{item}</span>
						</li>
					{/each}
				</ul>
			</div>

			<div
				class="flex flex-col gap-3 rounded-xl border border-t-4 border-t-primary/40 bg-primary/5 p-5"
			>
				<span class="icon-[lucide--user-check] size-5 text-primary" aria-hidden="true"></span>
				<p class="text-sm font-medium">{m['HelpClaimBookingPage.compareClaimTitle']()}</p>
				<p class="text-sm leading-6 text-muted-foreground">
					{m['HelpClaimBookingPage.compareClaimBody']()}
				</p>
				<ul class="mt-1 flex flex-col gap-2 text-sm">
					{#each claimItems as item (item)}
						<li class="flex items-start gap-2">
							<span
								class="mt-1 icon-[lucide--check] size-4 shrink-0 text-primary"
								aria-hidden="true"
							></span>
							<span class="text-muted-foreground">{item}</span>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	</section>

	<section id="how">
		<h2 class="text-xl font-semibold tracking-tight">{m['HelpClaimBookingPage.howTitle']()}</h2>
		<p class="mt-3 text-base leading-7 text-muted-foreground">
			{m['HelpClaimBookingPage.howIntro']()}
		</p>

		<ol class="mt-6 flex flex-col gap-3">
			{#each claimSteps as step, index (step.title)}
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

	<section id="rules">
		<h2 class="text-xl font-semibold tracking-tight">{m['HelpClaimBookingPage.rulesTitle']()}</h2>

		<ul class="mt-6 grid gap-4 sm:grid-cols-2">
			{#each rules as rule (rule.title)}
				<li class="flex gap-3 rounded-xl border bg-card p-5">
					<span class="{rule.icon} mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true"></span>
					<div class="min-w-0">
						<p class="text-sm font-medium">{rule.title}</p>
						<p class="mt-1 text-sm leading-6 text-muted-foreground">{rule.body}</p>
					</div>
				</li>
			{/each}
		</ul>
	</section>

	<section id="security" class="rounded-xl border border-primary/25 bg-primary/5 p-5 sm:p-6">
		<div class="flex items-start gap-3">
			<span
				class="mt-0.5 icon-[lucide--shield-check] size-5 shrink-0 text-primary"
				aria-hidden="true"
			></span>
			<div class="min-w-0">
				<h2 class="text-base font-semibold">{m['HelpClaimBookingPage.securityTitle']()}</h2>
				<p class="mt-2 text-sm leading-6">{m['HelpClaimBookingPage.securityBody']()}</p>
			</div>
		</div>
	</section>

	<section id="troubleshooting">
		<h2 class="text-xl font-semibold tracking-tight">
			{m['HelpClaimBookingPage.troubleTitle']()}
		</h2>

		<dl class="mt-6 flex flex-col gap-3">
			{#each troubleItems as item (item.title)}
				<div class="rounded-xl border bg-card p-5">
					<dt class="text-sm font-medium">{item.title}</dt>
					<dd class="mt-1 text-sm leading-6 text-muted-foreground">{item.body}</dd>
				</div>
			{/each}
		</dl>
	</section>

	<div class="mt-12 rounded-xl border bg-muted/30 p-5 sm:p-6">
		<h2 class="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
			{m['HelpClaimBookingPage.relatedTitle']()}
		</h2>

		<ul class="mt-3 flex flex-col gap-2 text-sm">
			<li>
				<Link
					href={UNPROTECTED_PAGE_ENDPOINTS.HELP_BOOKING}
					class="font-medium text-primary underline-offset-4 hover:underline"
				>
					{m['HelpClaimBookingPage.relatedBooking']()}
				</Link>
			</li>
			<li>
				<Link
					href={UNPROTECTED_PAGE_ENDPOINTS.HELP_CANCELLATION_POLICY}
					class="font-medium text-primary underline-offset-4 hover:underline"
				>
					{m['HelpClaimBookingPage.relatedCancellation']()}
				</Link>
			</li>
		</ul>
	</div>

	<p class="mt-10 text-sm leading-6 text-muted-foreground">
		{m['HelpClaimBookingPage.questions']()}
		<Link
			href={UNPROTECTED_PAGE_ENDPOINTS.CONTACT}
			class="font-medium text-primary underline-offset-4 hover:underline"
		>
			{m['HelpClaimBookingPage.contactSupport']()}
		</Link>
	</p>
</HelpContent>
