<script lang="ts">
	// COMPONENTS
	import { Skeleton } from '@/components/ui/skeleton/index.js';
</script>

<div class="flex w-full flex-col gap-8" aria-busy="true" aria-live="polite">
	<div class="flex flex-col gap-2">
		<Skeleton class="h-6 w-40" />
		<Skeleton class="h-4 w-72" />
	</div>
	<div class="flex flex-col gap-2">
		<Skeleton class="h-3 w-24" />
		{#each Array(4) as _, index (index)}
			<Skeleton class="h-24 w-full rounded-lg" />
		{/each}
	</div>
</div>
