<script lang="ts">
	// COMPONENTS
	import HelpContent from '@/components/pages/(unprotected)/help/help-content.svelte';
	import Link from '@/components/ui/custom-components/link/link.svelte';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// UTILS
	import { m } from '@/lib/paraglide/messages';

	const headingClass = 'text-xl font-semibold tracking-tight';
	const bodyClass = 'mt-3 text-base leading-7 text-muted-foreground';

	const sections = [
		{ id: 'short-version', label: m['HelpCancellationPolicyPage.summaryTitle']() },
		{ id: 'standard', label: m['HelpCancellationPolicyPage.standardTitle']() },
		{ id: 'custom', label: m['HelpCancellationPolicyPage.customTitle']() },
		{ id: 'timing', label: m['HelpCancellationPolicyPage.timingTitle']() },
		{ id: 'locked', label: m['HelpCancellationPolicyPage.lockedTitle']() },
		{ id: 'cancelling', label: m['HelpCancellationPolicyPage.cancellingTitle']() },
		{ id: 'host', label: m['HelpCancellationPolicyPage.hostTitle']() },
		{ id: 'policy', label: m['HelpCancellationPolicyPage.seePolicyTitle']() },
		{ id: 'payments', label: m['HelpCancellationPolicyPage.paymentsTitle']() }
	];

	const summaryPoints = [
		m['HelpCancellationPolicyPage.summaryDefault'](),
		m['HelpCancellationPolicyPage.summaryHosts'](),
		m['HelpCancellationPolicyPage.summaryPermission'](),
		m['HelpCancellationPolicyPage.summaryLocked']()
	];

	const ranges = [
		{
			time: m['HelpCancellationPolicyPage.rangeSeven'](),
			refund: m['HelpCancellationPolicyPage.rangeSevenRefund']()
		},
		{
			time: m['HelpCancellationPolicyPage.rangeFive'](),
			refund: m['HelpCancellationPolicyPage.hostSets']()
		},
		{
			time: m['HelpCancellationPolicyPage.rangeThree'](),
			refund: m['HelpCancellationPolicyPage.hostSets']()
		},
		{
			time: m['HelpCancellationPolicyPage.rangeOne'](),
			refund: m['HelpCancellationPolicyPage.hostSets']()
		},
		{
			time: m['HelpCancellationPolicyPage.rangeFinal'](),
			refund: m['HelpCancellationPolicyPage.hostSets']()
		}
	];
</script>

<HelpContent
	title={m['HelpCancellationPolicyPage.pageTitle']()}
	description={m['HelpCancellationPolicyPage.lead']()}
	metaDescription={m['HelpCancellationPolicyPage.metaDescription']()}
	{sections}
>
	<section id="short-version" class="rounded-xl border bg-muted/30 p-5 sm:p-6">
		<h2 class="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
			{m['HelpCancellationPolicyPage.summaryTitle']()}
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

	<section id="standard">
		<h2 class={headingClass}>{m['HelpCancellationPolicyPage.standardTitle']()}</h2>
		<p class={bodyClass}>{m['HelpCancellationPolicyPage.standardBody1']()}</p>
		<p class={bodyClass}>{m['HelpCancellationPolicyPage.standardBody2']()}</p>
	</section>

	<section id="custom">
		<h2 class={headingClass}>{m['HelpCancellationPolicyPage.customTitle']()}</h2>
		<p class={bodyClass}>{m['HelpCancellationPolicyPage.customIntro']()}</p>

		<div class="mt-6 overflow-x-auto rounded-xl border">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b bg-muted/30 text-left">
						<th scope="col" class="px-4 py-3 font-medium">
							{m['HelpCancellationPolicyPage.customTableTime']()}
						</th>
						<th scope="col" class="px-4 py-3 font-medium">
							{m['HelpCancellationPolicyPage.customTableRefund']()}
						</th>
					</tr>
				</thead>
				<tbody>
					{#each ranges as range (range.time)}
						<tr class="border-b last:border-b-0">
							<th scope="row" class="px-4 py-3 text-left font-normal">{range.time}</th>
							<td class="px-4 py-3 text-muted-foreground">{range.refund}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<h3 class="mt-8 text-base font-semibold">
			{m['HelpCancellationPolicyPage.boundaryTitle']()}
		</h3>
		<p class={bodyClass}>{m['HelpCancellationPolicyPage.boundaryBody']()}</p>
		<p class={bodyClass}>{m['HelpCancellationPolicyPage.decreasingBody']()}</p>
	</section>

	<section id="timing">
		<h2 class={headingClass}>{m['HelpCancellationPolicyPage.timingTitle']()}</h2>
		<p class={bodyClass}>{m['HelpCancellationPolicyPage.timingBody1']()}</p>
		<p class={bodyClass}>{m['HelpCancellationPolicyPage.timingBody2']()}</p>
	</section>

	<section id="locked">
		<h2 class={headingClass}>{m['HelpCancellationPolicyPage.lockedTitle']()}</h2>
		<p class={bodyClass}>{m['HelpCancellationPolicyPage.lockedBody']()}</p>
	</section>

	<section id="cancelling">
		<h2 class={headingClass}>{m['HelpCancellationPolicyPage.cancellingTitle']()}</h2>
		<p class={bodyClass}>{m['HelpCancellationPolicyPage.cancellingBody1']()}</p>
		<p class={bodyClass}>{m['HelpCancellationPolicyPage.cancellingBody2']()}</p>
		<p class={bodyClass}>{m['HelpCancellationPolicyPage.cancellingBody3']()}</p>
		<p class={bodyClass}>{m['HelpCancellationPolicyPage.cancellingBody4']()}</p>
	</section>

	<section id="host">
		<h2 class={headingClass}>{m['HelpCancellationPolicyPage.hostTitle']()}</h2>
		<p class={bodyClass}>{m['HelpCancellationPolicyPage.hostBody1']()}</p>
		<p class={bodyClass}>{m['HelpCancellationPolicyPage.hostBody2']()}</p>
	</section>

	<section id="policy">
		<h2 class={headingClass}>{m['HelpCancellationPolicyPage.seePolicyTitle']()}</h2>
		<p class={bodyClass}>{m['HelpCancellationPolicyPage.seePolicyBody']()}</p>
	</section>

	<section id="payments" class="rounded-xl border border-warning/30 bg-warning/10 p-5 sm:p-6">
		<div class="flex items-start gap-3">
			<span
				class="mt-0.5 icon-[lucide--triangle-alert] size-5 shrink-0 text-warning"
				aria-hidden="true"
			></span>
			<div class="min-w-0">
				<h2 class="text-base font-semibold">
					{m['HelpCancellationPolicyPage.paymentsTitle']()}
				</h2>
				<p class="mt-2 text-sm leading-6">
					{m['HelpCancellationPolicyPage.paymentsBody']()}
				</p>
			</div>
		</div>
	</section>

	<div class="mt-12 rounded-xl border bg-muted/30 p-5 sm:p-6">
		<h2 class="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
			{m['HelpCancellationPolicyPage.relatedTitle']()}
		</h2>

		<ul class="mt-3 flex flex-col gap-2 text-sm">
			<li>
				<Link
					href={UNPROTECTED_PAGE_ENDPOINTS.HELP_BOOKING}
					class="font-medium text-primary underline-offset-4 hover:underline"
				>
					{m['HelpCancellationPolicyPage.relatedBooking']()}
				</Link>
			</li>
			<li>
				<Link
					href={UNPROTECTED_PAGE_ENDPOINTS.HELP_TIMEZONE}
					class="font-medium text-primary underline-offset-4 hover:underline"
				>
					{m['HelpCancellationPolicyPage.relatedTimezone']()}
				</Link>
			</li>
			<li>
				<Link
					href={UNPROTECTED_PAGE_ENDPOINTS.HELP_FOR_HOSTS}
					class="font-medium text-primary underline-offset-4 hover:underline"
				>
					{m['HelpCancellationPolicyPage.relatedForHosts']()}
				</Link>
			</li>
		</ul>
	</div>

	<p class="mt-10 text-sm leading-6 text-muted-foreground">
		{m['HelpCancellationPolicyPage.questions']()}
		<Link
			href={UNPROTECTED_PAGE_ENDPOINTS.CONTACT}
			class="font-medium text-primary underline-offset-4 hover:underline"
		>
			{m['HelpCancellationPolicyPage.contactSupport']()}
		</Link>
	</p>
</HelpContent>
