<script lang="ts">
	// COMPONENTS
	import HelpContent from '@/components/pages/(unprotected)/help/help-content.svelte';
	import Link from '@/components/ui/custom-components/link/link.svelte';
	import BookingStatusBadge from '@/features/bookings/components/booking-status-badge/booking-status-badge.svelte';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// UTILS
	import { m } from '@/lib/paraglide/messages';

	// TYPES
	import type { BookingStatus } from '@/shared/features/bookings/types/bookingTypes.js';

	const sections = [
		{ id: 'short-version', label: m['HelpBookingPage.summaryTitle']() },
		{ id: 'journey', label: m['HelpBookingPage.journeyTitle']() },
		{ id: 'statuses', label: m['HelpBookingPage.statusesTitle']() },
		{ id: 'changes', label: m['HelpBookingPage.changesTitle']() },
		{ id: 'finding', label: m['HelpBookingPage.findingTitle']() },
		{ id: 'reviews', label: m['HelpBookingPage.reviewsTitle']() },
		{ id: 'payments', label: m['HelpBookingPage.paymentsTitle']() }
	];

	const summaryPoints = [
		m['HelpBookingPage.summaryRequest'](),
		m['HelpBookingPage.summaryStatuses'](),
		m['HelpBookingPage.summaryHost'](),
		m['HelpBookingPage.summaryNoPayment']()
	];

	type StatusCard = {
		status: BookingStatus;
		subtitle: string;
		meaning: string;
		how: string;
		next: string;
		accent: string;
		tint: string;
	};

	const statuses: StatusCard[] = [
		{
			status: 'pending',
			subtitle: m['HelpBookingPage.pendingSubtitle'](),
			meaning: m['HelpBookingPage.pendingMeaning'](),
			how: m['HelpBookingPage.pendingHow'](),
			next: m['HelpBookingPage.pendingNext'](),
			accent: 'border-t-warning/50',
			tint: 'bg-warning/5'
		},
		{
			status: 'confirmed',
			subtitle: m['HelpBookingPage.confirmedSubtitle'](),
			meaning: m['HelpBookingPage.confirmedMeaning'](),
			how: m['HelpBookingPage.confirmedHow'](),
			next: m['HelpBookingPage.confirmedNext'](),
			accent: 'border-t-success/50',
			tint: 'bg-success/5'
		},
		{
			status: 'declined',
			subtitle: m['HelpBookingPage.declinedSubtitle'](),
			meaning: m['HelpBookingPage.declinedMeaning'](),
			how: m['HelpBookingPage.declinedHow'](),
			next: m['HelpBookingPage.declinedNext'](),
			accent: 'border-t-destructive/50',
			tint: 'bg-destructive/5'
		},
		{
			status: 'cancelled',
			subtitle: m['HelpBookingPage.cancelledSubtitle'](),
			meaning: m['HelpBookingPage.cancelledMeaning'](),
			how: m['HelpBookingPage.cancelledHow'](),
			next: m['HelpBookingPage.cancelledNext'](),
			accent: 'border-t-border',
			tint: 'bg-muted/30'
		},
		{
			status: 'completed',
			subtitle: m['HelpBookingPage.completedSubtitle'](),
			meaning: m['HelpBookingPage.completedMeaning'](),
			how: m['HelpBookingPage.completedHow'](),
			next: m['HelpBookingPage.completedNext'](),
			accent: 'border-t-border',
			tint: 'bg-muted/30'
		}
	];
</script>

<HelpContent
	title={m['HelpBookingPage.pageTitle']()}
	description={m['HelpBookingPage.lead']()}
	metaDescription={m['HelpBookingPage.metaDescription']()}
	{sections}
>
	<section id="short-version" class="rounded-xl border bg-muted/30 p-5 sm:p-6">
		<h2 class="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
			{m['HelpBookingPage.summaryTitle']()}
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

	<section id="journey">
		<h2 class="text-xl font-semibold tracking-tight">{m['HelpBookingPage.journeyTitle']()}</h2>
		<p class="mt-3 text-base leading-7 text-muted-foreground">
			{m['HelpBookingPage.journeyIntro']()}
		</p>

		<ol class="mt-6 grid gap-3 sm:grid-cols-4">
			<li class="flex flex-col gap-3 rounded-xl border bg-card p-4">
				<span class="icon-[lucide--send] size-5 text-primary" aria-hidden="true"></span>
				<p class="text-sm font-medium">{m['HelpBookingPage.journeyStepRequest']()}</p>
				<p class="text-xs leading-5 text-muted-foreground">
					{m['HelpBookingPage.journeyStepRequestBody']()}
				</p>
			</li>

			<li
				class="flex flex-col gap-3 rounded-xl border border-t-4 border-t-warning/50 bg-warning/5 p-4"
			>
				<BookingStatusBadge status="pending" />
				<p class="text-xs leading-5 text-muted-foreground">
					{m['HelpBookingPage.journeyStepPendingBody']()}
				</p>
			</li>

			<li
				class="flex flex-col gap-3 rounded-xl border border-t-4 border-t-success/50 bg-success/5 p-4"
			>
				<BookingStatusBadge status="confirmed" />
				<p class="text-xs leading-5 text-muted-foreground">
					{m['HelpBookingPage.journeyStepConfirmedBody']()}
				</p>
			</li>

			<li class="flex flex-col gap-3 rounded-xl border border-t-4 border-t-border bg-muted/30 p-4">
				<BookingStatusBadge status="completed" />
				<p class="text-xs leading-5 text-muted-foreground">
					{m['HelpBookingPage.journeyStepCompletedBody']()}
				</p>
			</li>
		</ol>

		<p class="mt-4 text-sm leading-6 text-muted-foreground">
			{m['HelpBookingPage.journeyBranch']()}
			<Link
				href={UNPROTECTED_PAGE_ENDPOINTS.HELP_CANCELLATION_POLICY}
				class="font-medium text-primary underline-offset-4 hover:underline"
			>
				{m['HelpBookingPage.cancellationPolicyLink']()}
			</Link>
		</p>
	</section>

	<section id="statuses">
		<h2 class="text-xl font-semibold tracking-tight">{m['HelpBookingPage.statusesTitle']()}</h2>
		<p class="mt-3 text-base leading-7 text-muted-foreground">
			{m['HelpBookingPage.statusesIntro']()}
		</p>

		<ul class="mt-6 grid gap-4 sm:grid-cols-2">
			{#each statuses as status (status.status)}
				<li
					class="flex flex-col gap-4 rounded-xl border border-t-4 p-5 {status.accent} {status.tint}"
				>
					<div class="flex flex-wrap items-center gap-x-2 gap-y-1">
						<BookingStatusBadge status={status.status} />
						<span class="text-sm text-muted-foreground">{status.subtitle}</span>
					</div>

					<p class="text-sm leading-6">{status.meaning}</p>

					<dl class="flex flex-col gap-3 text-sm">
						<div class="flex flex-col gap-0.5">
							<dt class="font-medium">{m['HelpBookingPage.howYouGetIt']()}</dt>
							<dd class="text-muted-foreground">{status.how}</dd>
						</div>
						<div class="flex flex-col gap-0.5">
							<dt class="font-medium">{m['HelpBookingPage.whatHappensNext']()}</dt>
							<dd class="text-muted-foreground">{status.next}</dd>
						</div>
					</dl>
				</li>
			{/each}
		</ul>
	</section>

	<section id="changes">
		<h2 class="text-xl font-semibold tracking-tight">{m['HelpBookingPage.changesTitle']()}</h2>
		<p class="mt-3 text-base leading-7 text-muted-foreground">
			{m['HelpBookingPage.changesIntro']()}
		</p>

		<ul class="mt-6 flex flex-col gap-3">
			<li class="flex flex-wrap items-center gap-2 rounded-xl border bg-card px-4 py-3 text-sm">
				<BookingStatusBadge status="pending" />
				<span
					class="icon-[lucide--arrow-right] size-4 text-muted-foreground"
					aria-hidden="true"
				></span>
				<BookingStatusBadge status="confirmed" />
				<span class="text-muted-foreground">/</span>
				<BookingStatusBadge status="declined" />
			</li>

			<li class="flex flex-wrap items-center gap-2 rounded-xl border bg-card px-4 py-3 text-sm">
				<BookingStatusBadge status="confirmed" />
				<span
					class="icon-[lucide--arrow-right] size-4 text-muted-foreground"
					aria-hidden="true"
				></span>
				<BookingStatusBadge status="completed" />
				<span class="text-muted-foreground">/</span>
				<BookingStatusBadge status="cancelled" />
			</li>
		</ul>

		<p class="mt-4 text-sm leading-6 text-muted-foreground">
			{m['HelpBookingPage.changesFinal']()}
		</p>
	</section>

	<section id="finding">
		<h2 class="text-xl font-semibold tracking-tight">{m['HelpBookingPage.findingTitle']()}</h2>
		<p class="mt-3 text-base leading-7 text-muted-foreground">
			{m['HelpBookingPage.findingBody1']()}
		</p>
		<p class="mt-3 text-base leading-7 text-muted-foreground">
			{m['HelpBookingPage.findingBody2']()}
		</p>
	</section>

	<section id="reviews">
		<h2 class="text-xl font-semibold tracking-tight">{m['HelpBookingPage.reviewsTitle']()}</h2>
		<p class="mt-3 text-base leading-7 text-muted-foreground">
			{m['HelpBookingPage.reviewsBody']()}
		</p>
	</section>

	<section id="payments" class="rounded-xl border border-warning/30 bg-warning/10 p-5 sm:p-6">
		<div class="flex items-start gap-3">
			<span
				class="mt-0.5 icon-[lucide--triangle-alert] size-5 shrink-0 text-warning"
				aria-hidden="true"
			></span>
			<div class="min-w-0">
				<h2 class="text-base font-semibold">{m['HelpBookingPage.paymentsTitle']()}</h2>
				<p class="mt-2 text-sm leading-6">{m['HelpBookingPage.paymentsBody']()}</p>
			</div>
		</div>
	</section>

	<div class="mt-12 rounded-xl border bg-muted/30 p-5 sm:p-6">
		<h2 class="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
			{m['HelpBookingPage.relatedTitle']()}
		</h2>

		<ul class="mt-3 flex flex-col gap-2 text-sm">
			<li>
				<Link
					href={UNPROTECTED_PAGE_ENDPOINTS.HELP_FIND_AND_BOOK}
					class="font-medium text-primary underline-offset-4 hover:underline"
				>
					{m['HelpBookingPage.relatedFindAndBook']()}
				</Link>
			</li>
			<li>
				<Link
					href={UNPROTECTED_PAGE_ENDPOINTS.HELP_CLAIM_BOOKING}
					class="font-medium text-primary underline-offset-4 hover:underline"
				>
					{m['HelpBookingPage.relatedClaim']()}
				</Link>
			</li>
			<li>
				<Link
					href={UNPROTECTED_PAGE_ENDPOINTS.HELP_TIMEZONE}
					class="font-medium text-primary underline-offset-4 hover:underline"
				>
					{m['HelpBookingPage.relatedTimezone']()}
				</Link>
			</li>
		</ul>
	</div>

	<p class="mt-10 text-sm leading-6 text-muted-foreground">
		{m['HelpBookingPage.questions']()}
		<Link
			href={UNPROTECTED_PAGE_ENDPOINTS.CONTACT}
			class="font-medium text-primary underline-offset-4 hover:underline"
		>
			{m['HelpBookingPage.contactSupport']()}
		</Link>
	</p>
</HelpContent>
