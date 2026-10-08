<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import AnalyticsDashboardHeaderCustomCalendar from './analytics-dashboard-header-custom-calendar.svelte';
	import AnalyticsDashboardHeaderRefreshButton from './analytics-dashboard-header-refresh-button.svelte';
	import * as ToggleGroup from '@/components/ui/toggle-group/index.js';

	// HOOKS
	import {
		PRESET_TIME_RANGES,
		useAnalyticsDashboard
	} from '@/features/analytics/hooks/useAnalyticsDashboard.svelte.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { PresetTimeRange } from '@/shared/features/analytics/types/analyticsTypes.js';

	const analytics = useAnalyticsDashboard();

	const PRESET_LABELS = {
		today: m['AnalyticsFeature.AnalyticsDashboardHeader.today'],
		'7d': m['AnalyticsFeature.AnalyticsDashboardHeader.last7Days'],
		'30d': m['AnalyticsFeature.AnalyticsDashboardHeader.last30Days'],
		'90d': m['AnalyticsFeature.AnalyticsDashboardHeader.last90Days']
	} satisfies Record<PresetTimeRange, () => string>;
</script>

<div class="flex flex-wrap items-center">
	<ToggleGroup.Root
		type="single"
		bind:value={analytics.selectedPreset}
		onValueChange={analytics.handlePresetChange}
		variant="outline"
		size="sm"
		spacing={0}
		aria-label={m['AnalyticsFeature.AnalyticsDashboardHeader.timeRangeLabel']()}
	>
		{#each PRESET_TIME_RANGES as preset, index (preset)}
			<ToggleGroup.Item
				value={preset}
				aria-label={PRESET_LABELS[preset]()}
				class={cn(index === PRESET_TIME_RANGES.length - 1 && 'rounded-r-none!')}
			>
				{PRESET_LABELS[preset]()}
			</ToggleGroup.Item>
		{/each}
	</ToggleGroup.Root>

	<AnalyticsDashboardHeaderCustomCalendar />

	<AnalyticsDashboardHeaderRefreshButton />
</div>
