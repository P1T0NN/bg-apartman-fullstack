<script lang="ts">
	// COMPONENTS
	import AnalyticsDashboardHeaderTimeranges from './analytics-dashboard-header-timeranges.svelte';

	let { label, title }: { label: string; title: string } = $props();
</script>

<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
	<div class="flex flex-col gap-1">
		<p class="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
			{label}
		</p>
		<h1 class="text-2xl font-semibold tracking-tight">{title}</h1>
	</div>

	<AnalyticsDashboardHeaderTimeranges />
</div>
