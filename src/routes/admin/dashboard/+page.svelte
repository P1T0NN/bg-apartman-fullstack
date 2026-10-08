<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import AnalyticsDashboardHeader from '@/features/analytics/components/analytics-dashboard-header/analytics-dashboard-header.svelte';
	import AnalyticsRevenueChart from '@/features/analytics/components/analytics-revenue-chart/analytics-revenue-chart.svelte';
	import AnalyticsStats from '@/features/analytics/components/analytics-stats/analytics-stats.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';

	// HOOKS
	import { createAnalyticsDashboard } from '@/features/analytics/hooks/useAnalyticsDashboard.svelte.js';

	const analytics = createAnalyticsDashboard('admin');
</script>

<SvelteHead title={m['AdminDashboardPage.pageTitle']()} noindex />

<div class="flex min-h-full min-w-0 flex-1 flex-col gap-6">
	<AnalyticsDashboardHeader
		label={m['AdminDashboardPage.adminLabel']()}
		title={m['AdminDashboardPage.dashboard']()}
	/>

	<AnalyticsStats scope="admin" loading={analytics.statsLoading} error={analytics.statsError} />

	<AnalyticsRevenueChart />
</div>
