<script lang="ts">
	// LIBRARIES
	import { getLocale } from '@/lib/paraglide/runtime';
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import AnalyticsStatsCard from '@/features/analytics/components/analytics-stats-card/analytics-stats-card.svelte';
	import AnalyticsStatsLoading from '@/features/analytics/components/analytics-stats/loading/analytics-stats-loading.svelte';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';

	// HOOKS
	import { useAnalyticsDashboard } from '@/features/analytics/hooks/useAnalyticsDashboard.svelte.js';

	// UTILS
	import { getComparisonPercentage } from '@/shared/features/analytics/utils/getComparisonPercentage.js';
	import { formatCurrency } from '@/shared/utils/currency.js';

	// TYPES
	import type {
		AnalyticsScope,
		AnalyticsStat,
		DashboardStats
	} from '@/shared/features/analytics/types/analyticsTypes.js';

	let {
		scope,
		loading,
		error
	}: {
		scope: AnalyticsScope;
		loading: boolean;
		error?: Error;
	} = $props();

	const analytics = useAnalyticsDashboard();

	function formatPercentage(value: number): string {
		return new Intl.NumberFormat(getLocale(), {
			style: 'percent',
			maximumFractionDigits: 1
		}).format(value / 100);
	}

	const stats = $derived.by<AnalyticsStat[]>(() => {
		const data = analytics.statsData;
		if (!data) return [];

		const locale = getLocale();
		const { current, previous } = data;
		const compare = (select: (values: DashboardStats) => number) =>
			getComparisonPercentage(select(current), select(previous));

		const cards: AnalyticsStat[] = [
			{
				title: m['AnalyticsFeature.AnalyticsData.revenue'](),
				value: current.revenue,
				format: (value) => formatCurrency(value, locale),
				change: compare((values) => values.revenue)
			},
			{
				title: m['AnalyticsFeature.AnalyticsData.bookings'](),
				value: current.bookings,
				change: compare((values) => values.bookings)
			}
		];

		if (scope === 'admin') {
			cards.push({
				title: m['AnalyticsFeature.AnalyticsData.cancellationRate'](),
				value: current.cancellationRate,
				format: formatPercentage,
				change: compare((values) => values.cancellationRate),
				lowerIsBetter: true
			});
			return cards;
		}

		cards.push({
			title: m['AnalyticsFeature.AnalyticsData.occupancyRate'](),
			value: current.occupancyRate,
			format: formatPercentage,
			change: compare((values) => values.occupancyRate)
		});
		return cards;
	});
</script>

{#if error}
	<ErrorComponent message={m['AnalyticsFeature.AnalyticsStats.loadError']()} />
{:else if loading || stats.length === 0}
	<AnalyticsStatsLoading />
{:else}
	<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
		{#each stats as stat (stat.title)}
			<AnalyticsStatsCard {...stat} />
		{/each}
	</div>
{/if}
