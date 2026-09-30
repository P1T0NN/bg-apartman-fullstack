<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '@convex/_generated/api';
	import { m } from '@/lib/paraglide/messages';
	import HostDashboardHeader from '@/components/pages/(protected)/host/dashboard/host-dashboard-header.svelte';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';
	import Link from '@/components/ui/custom-components/link/link.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
	import { useSearchParams } from '@/hooks/useSearchParams.svelte';
	import { PROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	const pendingBookings = useQuery(
		api.tables.bookings.queries.hasPendingHostBookings.hasPendingHostBookings,
		{}
	);
	const { href } = useSearchParams(['status']);
	const pendingHref = href(PROTECTED_PAGE_ENDPOINTS.HOST_BOOKINGS, { status: 'pending' });
</script>

<SvelteHead title={m['HostDashboardPage.pageTitle']()} noindex />

<div class="flex flex-col gap-6">
	<HostDashboardHeader />
	{#if pendingBookings.error}
		<ErrorComponent message={m['ErrorMessages.loadFailed']()} />
	{:else if pendingBookings.data}
		<Link
			href={pendingHref}
			class="flex items-start gap-4 rounded-xl border border-primary/20 bg-primary/5 p-5 transition-colors hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
		>
			<span
				class="mt-0.5 icon-[lucide--calendar-clock] size-5 shrink-0 text-primary"
				aria-hidden="true"
			></span>
			<div class="min-w-0 flex-1 space-y-1">
				<h2 class="font-semibold">{m['HostDashboardPage.pendingTitle']()}</h2>
				<p class="text-sm leading-6 text-muted-foreground">
					{m['HostDashboardPage.pendingDescription']()}
				</p>
				<p class="pt-2 text-sm font-medium text-primary">
					{m['HostDashboardPage.reviewPending']()}
				</p>
			</div>
			<span
				class="mt-0.5 icon-[lucide--arrow-right] size-5 shrink-0 text-primary"
				aria-hidden="true"
			></span>
		</Link>
	{/if}
</div>
