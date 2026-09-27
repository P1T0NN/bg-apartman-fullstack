<script lang="ts">
	// COMPONENTS
	import { Skeleton } from '@/components/ui/skeleton/index.js';

	let { multiple = false, count = 6 }: { multiple?: boolean; count?: number } = $props();
</script>

{#snippet item()}
	<div class="flex flex-col gap-3">
		<Skeleton class="aspect-4/3 w-full rounded-2xl" />
		<div class="flex flex-col gap-2 px-1">
			<Skeleton class="h-3 w-28" />
			<Skeleton class="h-5 w-3/4" />
			<Skeleton class="h-3 w-1/2" />
			<Skeleton class="mt-2 h-6 w-32" />
		</div>
	</div>
{/snippet}

{#if multiple}
	<div class="grid grid-cols-1 gap-x-5 gap-y-9 sm:grid-cols-2" aria-hidden="true">
		{#each Array(count)}
			{@render item()}
		{/each}
	</div>
{:else}
	<div aria-hidden="true">
		{@render item()}
	</div>
{/if}
