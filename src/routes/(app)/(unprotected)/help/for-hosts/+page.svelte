<script lang="ts">
	// COMPONENTS
	import HelpContent from '@/components/pages/(unprotected)/help/help-content.svelte';
	import Link from '@/components/ui/custom-components/link/link.svelte';
	import BookingStatusBadge from '@/features/bookings/components/booking-status-badge/booking-status-badge.svelte';
	import { Badge } from '@/components/ui/badge/index.js';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// UTILS
	import { m } from '@/lib/paraglide/messages';

	const sections = [
		{ id: 'short-version', label: m['HelpForHostsPage.summaryTitle']() },
		{ id: 'workspace', label: m['HelpForHostsPage.workspaceTitle']() },
		{ id: 'create', label: m['HelpForHostsPage.createTitle']() },
		{ id: 'manage', label: m['HelpForHostsPage.manageTitle']() },
		{ id: 'bookings', label: m['HelpForHostsPage.bookingsTitle']() },
		{ id: 'after-stay', label: m['HelpForHostsPage.afterStayTitle']() },
		{ id: 'payments', label: m['HelpForHostsPage.paymentsTitle']() },
		{ id: 'soon', label: m['HelpForHostsPage.soonTitle']() }
	];

	const summaryPoints = [
		m['HelpForHostsPage.summaryOne'](),
		m['HelpForHostsPage.summaryTwo'](),
		m['HelpForHostsPage.summaryThree'](),
		m['HelpForHostsPage.summaryFour']()
	];

	const workspaceLinks = [
		{
			icon: 'icon-[lucide--layout-dashboard]',
			title: m['HelpForHostsPage.workspaceDashboard'](),
			body: m['HelpForHostsPage.workspaceDashboardBody']()
		},
		{
			icon: 'icon-[lucide--circle-plus]',
			title: m['HelpForHostsPage.workspaceAdd'](),
			body: m['HelpForHostsPage.workspaceAddBody']()
		},
		{
			icon: 'icon-[lucide--house]',
			title: m['HelpForHostsPage.workspaceAccommodations'](),
			body: m['HelpForHostsPage.workspaceAccommodationsBody']()
		},
		{
			icon: 'icon-[lucide--calendar-check]',
			title: m['HelpForHostsPage.workspaceBookings'](),
			body: m['HelpForHostsPage.workspaceBookingsBody']()
		}
	];

	const createSteps = [
		{
			title: m['HelpForHostsPage.createStepBasics'](),
			body: m['HelpForHostsPage.createStepBasicsBody']()
		},
		{
			title: m['HelpForHostsPage.createStepLocation'](),
			body: m['HelpForHostsPage.createStepLocationBody']()
		},
		{
			title: m['HelpForHostsPage.createStepAmenities'](),
			body: m['HelpForHostsPage.createStepAmenitiesBody']()
		},
		{
			title: m['HelpForHostsPage.createStepPhotos'](),
			body: m['HelpForHostsPage.createStepPhotosBody']()
		},
		{
			title: m['HelpForHostsPage.createStepPricing'](),
			body: m['HelpForHostsPage.createStepPricingBody']()
		},
		{
			title: m['HelpForHostsPage.createStepRules'](),
			body: m['HelpForHostsPage.createStepRulesBody']()
		},
		{
			title: m['HelpForHostsPage.createStepCancellation'](),
			body: m['HelpForHostsPage.createStepCancellationBody']()
		},
		{
			title: m['HelpForHostsPage.createStepReview'](),
			body: m['HelpForHostsPage.createStepReviewBody']()
		}
	];

	const soonItems = [
		m['HelpForHostsPage.soonCalendar'](),
		m['HelpForHostsPage.soonSettings'](),
		m['HelpForHostsPage.soonNotifications'](),
		m['HelpForHostsPage.soonPayments']()
	];
</script>

<HelpContent
	title={m['HelpForHostsPage.pageTitle']()}
	description={m['HelpForHostsPage.lead']()}
	metaDescription={m['HelpForHostsPage.metaDescription']()}
	{sections}
>
	<section id="short-version" class="rounded-xl border bg-muted/30 p-5 sm:p-6">
		<h2 class="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
			{m['HelpForHostsPage.summaryTitle']()}
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

	<section id="workspace">
		<h2 class="text-xl font-semibold tracking-tight">{m['HelpForHostsPage.workspaceTitle']()}</h2>
		<p class="mt-3 text-base leading-7 text-muted-foreground">
			{m['HelpForHostsPage.workspaceIntro']()}
		</p>

		<ul class="mt-6 grid gap-3 sm:grid-cols-2">
			{#each workspaceLinks as link (link.title)}
				<li class="flex gap-3 rounded-xl border bg-card p-4">
					<span class="{link.icon} mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true"></span>
					<div class="min-w-0">
						<p class="text-sm font-medium">{link.title}</p>
						<p class="mt-1 text-xs leading-5 text-muted-foreground">{link.body}</p>
					</div>
				</li>
			{/each}
		</ul>

		<p class="mt-4 text-sm leading-6 text-muted-foreground">
			{m['HelpForHostsPage.workspaceSwitch']()}
		</p>
	</section>

	<section id="create">
		<h2 class="text-xl font-semibold tracking-tight">{m['HelpForHostsPage.createTitle']()}</h2>
		<p class="mt-3 text-base leading-7 text-muted-foreground">
			{m['HelpForHostsPage.createIntro']()}
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

	<section id="manage">
		<h2 class="text-xl font-semibold tracking-tight">{m['HelpForHostsPage.manageTitle']()}</h2>
		<p class="mt-3 text-base leading-7 text-muted-foreground">
			{m['HelpForHostsPage.manageIntro']()}
		</p>

		<ul class="mt-6 grid gap-4 sm:grid-cols-3">
			<li
				class="flex flex-col gap-3 rounded-xl border border-t-4 border-t-success/50 bg-success/5 p-5"
			>
				<div class="flex flex-wrap items-center justify-between gap-2">
					<span class="icon-[lucide--list] size-5 text-success" aria-hidden="true"></span>
					<Badge variant="outline" class="border-success/30 bg-success/10 text-success">
						{m['HelpForHostsPage.availableNow']()}
					</Badge>
				</div>
				<p class="text-sm font-medium">{m['HelpForHostsPage.manageTabListing']()}</p>
				<p class="text-xs leading-5 text-muted-foreground">
					{m['HelpForHostsPage.manageTabListingBody']()}
				</p>
			</li>

			<li class="flex flex-col gap-3 rounded-xl border bg-muted/30 p-5">
				<div class="flex flex-wrap items-center justify-between gap-2">
					<span
						class="icon-[lucide--calendar-days] size-5 text-muted-foreground"
						aria-hidden="true"
					></span>
					<Badge variant="outline">{m['HelpForHostsPage.previewOnly']()}</Badge>
				</div>
				<p class="text-sm font-medium">{m['HelpForHostsPage.manageTabCalendar']()}</p>
				<p class="text-xs leading-5 text-muted-foreground">
					{m['HelpForHostsPage.manageTabCalendarBody']()}
				</p>
			</li>

			<li class="flex flex-col gap-3 rounded-xl border bg-muted/30 p-5">
				<div class="flex flex-wrap items-center justify-between gap-2">
					<span
						class="icon-[lucide--settings] size-5 text-muted-foreground"
						aria-hidden="true"
					></span>
					<Badge variant="outline">{m['HelpForHostsPage.previewOnly']()}</Badge>
				</div>
				<p class="text-sm font-medium">{m['HelpForHostsPage.manageTabSettings']()}</p>
				<p class="text-xs leading-5 text-muted-foreground">
					{m['HelpForHostsPage.manageTabSettingsBody']()}
				</p>
			</li>
		</ul>

		<p class="mt-4 text-sm leading-6 text-muted-foreground">
			{m['HelpForHostsPage.manageLocked']()}
		</p>
	</section>

	<section id="bookings">
		<h2 class="text-xl font-semibold tracking-tight">{m['HelpForHostsPage.bookingsTitle']()}</h2>
		<p class="mt-3 text-base leading-7 text-muted-foreground">
			{m['HelpForHostsPage.bookingsIntro']()}
		</p>
		<p class="mt-3 text-base leading-7 text-muted-foreground">
			{m['HelpForHostsPage.bookingsOrder']()}
		</p>

		<h3 class="mt-8 text-base font-semibold">{m['HelpForHostsPage.bookingsActionsTitle']()}</h3>

		<ul class="mt-4 flex flex-col gap-3">
			<li class="flex flex-wrap items-center gap-2 rounded-xl border bg-card px-4 py-3 text-sm">
				<BookingStatusBadge status="pending" />
				<span
					class="icon-[lucide--arrow-right] size-4 text-muted-foreground"
					aria-hidden="true"
				></span>
				<span class="font-medium">{m['HelpForHostsPage.bookingsPendingActions']()}</span>
			</li>

			<li class="flex flex-wrap items-center gap-2 rounded-xl border bg-card px-4 py-3 text-sm">
				<BookingStatusBadge status="confirmed" />
				<span
					class="icon-[lucide--arrow-right] size-4 text-muted-foreground"
					aria-hidden="true"
				></span>
				<span class="font-medium">{m['HelpForHostsPage.bookingsConfirmedActions']()}</span>
			</li>
		</ul>

		<p class="mt-4 text-sm leading-6 text-muted-foreground">
			{m['HelpForHostsPage.bookingsFinal']()}
		</p>
		<p class="mt-3 text-sm leading-6 text-muted-foreground">
			{m['HelpForHostsPage.bookingsNotice']()}
		</p>
	</section>

	<section id="after-stay">
		<h2 class="text-xl font-semibold tracking-tight">{m['HelpForHostsPage.afterStayTitle']()}</h2>
		<p class="mt-3 text-base leading-7 text-muted-foreground">
			{m['HelpForHostsPage.afterStayBody1']()}
		</p>
		<p class="mt-3 text-base leading-7 text-muted-foreground">
			{m['HelpForHostsPage.afterStayBody2']()}
		</p>
	</section>

	<section id="payments" class="rounded-xl border border-warning/30 bg-warning/10 p-5 sm:p-6">
		<div class="flex items-start gap-3">
			<span
				class="mt-0.5 icon-[lucide--triangle-alert] size-5 shrink-0 text-warning"
				aria-hidden="true"
			></span>
			<div class="min-w-0">
				<h2 class="text-base font-semibold">{m['HelpForHostsPage.paymentsTitle']()}</h2>
				<p class="mt-2 text-sm leading-6">{m['HelpForHostsPage.paymentsBody']()}</p>
			</div>
		</div>
	</section>

	<section id="soon">
		<h2 class="text-xl font-semibold tracking-tight">{m['HelpForHostsPage.soonTitle']()}</h2>
		<p class="mt-3 text-base leading-7 text-muted-foreground">
			{m['HelpForHostsPage.soonIntro']()}
		</p>

		<ul class="mt-6 flex flex-col gap-2 text-sm leading-6">
			{#each soonItems as item (item)}
				<li class="flex items-start gap-2.5 rounded-lg border bg-muted/30 px-4 py-2.5">
					<span
						class="mt-1 icon-[lucide--hourglass] size-4 shrink-0 text-muted-foreground"
						aria-hidden="true"
					></span>
					<span>{item}</span>
				</li>
			{/each}
		</ul>
	</section>

	<div class="mt-12 rounded-xl border bg-muted/30 p-5 sm:p-6">
		<h2 class="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
			{m['HelpForHostsPage.relatedTitle']()}
		</h2>

		<ul class="mt-3 flex flex-col gap-2 text-sm">
			<li>
				<Link
					href={UNPROTECTED_PAGE_ENDPOINTS.HELP_BOOKING}
					class="font-medium text-primary underline-offset-4 hover:underline"
				>
					{m['HelpForHostsPage.relatedBooking']()}
				</Link>
			</li>
			<li>
				<Link
					href={UNPROTECTED_PAGE_ENDPOINTS.HELP_CANCELLATION_POLICY}
					class="font-medium text-primary underline-offset-4 hover:underline"
				>
					{m['HelpForHostsPage.relatedCancellation']()}
				</Link>
			</li>
			<li>
				<Link
					href={UNPROTECTED_PAGE_ENDPOINTS.HELP_TIMEZONE}
					class="font-medium text-primary underline-offset-4 hover:underline"
				>
					{m['HelpForHostsPage.relatedTimezone']()}
				</Link>
			</li>
		</ul>
	</div>

	<p class="mt-10 text-sm leading-6 text-muted-foreground">
		{m['HelpForHostsPage.questions']()}
		<Link
			href={UNPROTECTED_PAGE_ENDPOINTS.CONTACT}
			class="font-medium text-primary underline-offset-4 hover:underline"
		>
			{m['HelpForHostsPage.contactSupport']()}
		</Link>
	</p>
</HelpContent>
