<script lang="ts">
	// COMPONENTS
	import { Skeleton } from '@/components/ui/skeleton/index.js';

	// TYPES
	import type { AnalyticsScope } from '@/shared/features/analytics/types/analyticsTypes.js';

	let { scope }: { scope: AnalyticsScope } = $props();
	const skeletons = $derived(scope === 'host' ? [0, 1] : [0, 1, 2, 3, 4]);
</script>

<div class={['grid gap-4 sm:grid-cols-2', scope === 'admin' && 'xl:grid-cols-5']}>
	{#each skeletons as skeleton (skeleton)}
		<Skeleton class="h-40 rounded-4xl" />
	{/each}
</div>
